import sys
import json
import ctypes
import os

# 1. Define C Structures
class Slot(ctypes.Structure):
    _fields_ = [
        ("slot_id", ctypes.c_int),
        ("is_booked", ctypes.c_int),
        ("teacher_id", ctypes.c_int),
        ("is_lab", ctypes.c_int),
    ]

class WaitlistEntry(ctypes.Structure):
    _fields_ = [
        ("teacher_id", ctypes.c_int),
        ("desired_slot_id", ctypes.c_int),
        ("is_lab", ctypes.c_int),
        ("status", ctypes.c_int),
    ]

def get_lib():
    # Determine the correct library name based on OS
    lib_name = "scheduler_core.so"
    if os.name == 'nt': 
        lib_name = "scheduler_core.dll"
    elif sys.platform == 'darwin':
        lib_name = "scheduler_core.so" # macOS often uses .so or .dylib

    # SMART PATH FINDING
    # If frozen (exe), look in the same folder as the executable
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    else:
        # If script, look in current directory
        application_path = os.path.dirname(__file__)
    
    path = os.path.join(application_path, lib_name)
    return ctypes.CDLL(path)

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            return

        raw_data = sys.argv[1]
        data = json.loads(raw_data)
        
        slots_in = data['slots']
        wait_in = data['waitlist']
        
        n_slots = len(slots_in)
        n_wait = len(wait_in)

        # Create C Arrays
        SlotArray = Slot * n_slots
        c_slots = SlotArray()
        for i, s in enumerate(slots_in):
            c_slots[i].slot_id = int(s['id'])
            c_slots[i].is_booked = 1 if s['bookedBy'] else 0
            c_slots[i].teacher_id = int(s['bookedBy']) if s['bookedBy'] else 0
            c_slots[i].is_lab = 1 if s['type'] == 'Lab' else 0

        WaitArray = WaitlistEntry * n_wait
        c_waitlist = WaitArray()
        for i, w in enumerate(wait_in):
            c_waitlist[i].teacher_id = int(w['teacherId'])
            c_waitlist[i].desired_slot_id = int(w['slotId'])
            c_waitlist[i].is_lab = 1 if w['type'] == 'Lab' else 0
            c_waitlist[i].status = 0

        lib = get_lib()
        lib.process_waitlist.argtypes = [ctypes.c_int, ctypes.POINTER(Slot), ctypes.c_int, ctypes.POINTER(WaitlistEntry)]
        lib.process_waitlist(n_slots, c_slots, n_wait, c_waitlist)

        updated_slots = []
        for i in range(n_slots):
            updated_slots.append({
                "id": c_slots[i].slot_id,
                "bookedBy": c_slots[i].teacher_id if c_slots[i].is_booked else None,
                "type": "Lab" if c_slots[i].is_lab else "Theory"
            })

        print(json.dumps(updated_slots))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
