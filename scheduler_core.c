#include <stdio.h>
#include <stdlib.h>

// Structure for a Time Slot
typedef struct {
    int slot_id;      // 0-6 (Hours of the school day)
    int is_booked;    // 1 = Booked, 0 = Free
    int teacher_id;   // ID of the teacher holding the slot
    int is_lab;       // 1 = Lab Session, 0 = Theory Class
} Slot;

// Structure for a Waitlist Request
typedef struct {
    int teacher_id;
    int desired_slot_id;
    int is_lab;
    int status;       // 0 = Pending, 1 = Success (Got the slot)
} WaitlistEntry;

// THE LOGIC:
// Iterates through the waitlist. If a desired slot is found to be free (cancelled),
// it instantly assigns it to the waiting teacher.
void process_waitlist(int num_slots, Slot *slots, int num_wait, WaitlistEntry *waitlist) {
    for (int w = 0; w < num_wait; w++) {
        // Only process pending requests
        if (waitlist[w].status == 0) {
            int target = waitlist[w].desired_slot_id;

            // Safety check for bounds
            if (target >= 0 && target < num_slots) {
                // If the slot is now FREE (is_booked == 0)
                if (slots[target].is_booked == 0) {
                    // Assign it!
                    slots[target].is_booked = 1;
                    slots[target].teacher_id = waitlist[w].teacher_id;
                    slots[target].is_lab = waitlist[w].is_lab;
                    
                    // Mark request as fulfilled
                    waitlist[w].status = 1;
                }
            }
        }
    }
}
