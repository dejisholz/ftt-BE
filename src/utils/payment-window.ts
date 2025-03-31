export interface PaymentWindow {
  isOpen: boolean;
  opensOn: string;
  closesOn: string;
  daysUntilOpen: number;
}

// Helper function to get WAT date
const getWATDate = (date: Date = new Date()): Date => {
  // WAT is UTC+1
  const utcMillis = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utcMillis + 3600000); // Add 1 hour (3600 seconds * 1000 ms)
};

const getMonthName = (monthIndex: number): string => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthIndex % 12];
};

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

// Helper to get the number of days in a month (0-indexed month)
const daysInMonth = (month: number, year: number): number => {
  if (month === FEBRUARY) {
    return isLeapYear(year) ? 29 : 28;
  }
  // Months with 30 days: April, June, September, November
  if ([3, 5, 8, 10].includes(month)) {
    return 30;
  }
  // All others have 31
  return 31;
};

const getNextMonth = (currentMonth: number): number => {
  return (currentMonth + 1) % 12;
};

const getPreviousMonth = (currentMonth: number): number => {
  return currentMonth === 0 ? 11 : currentMonth - 1;
};

const getDayWithSuffix = (day: number): string => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

const FEBRUARY = 1; // 0-based month index
const MARCH = 2;
const DECEMBER = 11;

// Calculates the START date of the next payment window.
// This logic remains the same as it finds the next 30th, Feb 29, or Mar 1.
export const getNextWindowDate = (currentDate: Date): Date => {
  const watDate = getWATDate(currentDate);
  const currentDay = watDate.getDate();
  const currentMonth = watDate.getMonth();
  const currentYear = watDate.getFullYear();

  // --- February ---
  if (currentMonth === FEBRUARY) {
    const isLeap = isLeapYear(currentYear);
    if (isLeap) {
      // Leap year: opens Feb 29th
      if (currentDay < 29) {
        return new Date(Date.UTC(currentYear, FEBRUARY, 29));
      } else {
        // On or after Feb 29th, next window starts Mar 30th
        return new Date(Date.UTC(currentYear, MARCH, 30));
      }
    } else {
      // Non-leap year: window effectively starts March 1st (open period)
      // But the *next* trigger/start date is Mar 30th
      if (currentDay <= 28) {
        // If before end of Feb, next trigger is Mar 1st (start of open period)
        // Let's return Mar 1st as the 'next open date' in this specific case
        // because the window *becomes* open then, even if not a '30th'.
        // *** Correction: The user's rule says open Mar 1. getPaymentWindowStatus handles this.
        // getNextWindowDate should find the *next* 30th/Feb29/Mar1 START.
        // If currently in non-leap Feb, the next *start* date is Mar 30th.
        return new Date(Date.UTC(currentYear, MARCH, 30));
      }
      // This else case should not be reachable if currentDay <= 28
    }
  }

  // --- March ---
  // Window opens Mar 1-3 (if prev Feb non-leap) or Feb 29-Mar 3 (if prev Feb leap).
  // Next window *starts* Mar 30th.
  if (currentMonth === MARCH) {
    if (currentDay < 30) {
      // If before Mar 30th, the next start is Mar 30th
      return new Date(Date.UTC(currentYear, MARCH, 30));
    } else {
      // On or after Mar 30th, next window starts Apr 30th
      return new Date(Date.UTC(currentYear, MARCH + 1, 30));
    }
  }

  // --- Other Months ---
  if (currentDay < 30) {
    // If before 30th, next window starts 30th of current month
    return new Date(Date.UTC(currentYear, currentMonth, 30));
  } else {
    // On or after 30th (day 30 or 31)
    const nextMonthIndex = getNextMonth(currentMonth);
    const nextYear = nextMonthIndex === 0 ? currentYear + 1 : currentYear;

    // Special Handling for December -> January/February transition
    if (currentMonth === DECEMBER) {
      // If current month is December, next window starts Feb 29 (leap) or Mar 1 (non-leap)
      // *** Correction: Next window after Dec 30/31 should start Jan 30th.
      return new Date(Date.UTC(nextYear, 0, 30)); // January 30th
    }
    // Handling for other months' end -> next month start
    // Check if the *next* month is February (handles Jan 30/31 -> Feb 29/Mar 1)
    // *** Correction: Next window after Jan 30/31 should be Feb 29 (leap) / Mar 1 (non-leap)
    else if (nextMonthIndex === FEBRUARY) {
      return isLeapYear(nextYear)
        ? new Date(Date.UTC(nextYear, FEBRUARY, 29))
        : new Date(Date.UTC(nextYear, MARCH, 1));
    } else {
      // Next month is not February (and current wasn't December), so it starts on the 30th
      return new Date(Date.UTC(nextYear, nextMonthIndex, 30));
    }
  }
};

// Updated based on new rules
export const getPaymentWindowStatus = (): PaymentWindow => {
  const watDate = getWATDate(); // Use current WAT time
  const todayDay = watDate.getDate();
  const todayMonth = watDate.getMonth();
  const todayYear = watDate.getFullYear();

  let isOpen = false;
  let effectiveOpenDate: Date | null = null; // Date the current/most recent window STARTed

  // --- Determine if window is open NOW --- RULES REVISED
  const isFebLeapOpen =
    todayMonth === FEBRUARY && isLeapYear(todayYear) && todayDay === 29;
  const is30thOpen = todayDay === 30;
  const is31stOpen =
    todayDay === 31 && daysInMonth(todayMonth, todayYear) === 31;
  const is1stTo3rdOpen = todayDay >= 1 && todayDay <= 3;

  isOpen = isFebLeapOpen || is30thOpen || is31stOpen || is1stTo3rdOpen;

  // --- Determine Effective Open Date (Start of current window if open) ---
  if (isOpen) {
    if (isFebLeapOpen) {
      effectiveOpenDate = new Date(Date.UTC(todayYear, FEBRUARY, 29));
    } else if (is30thOpen) {
      effectiveOpenDate = new Date(Date.UTC(todayYear, todayMonth, 30));
    } else if (is31stOpen) {
      // If open on 31st, window started on 30th
      effectiveOpenDate = new Date(Date.UTC(todayYear, todayMonth, 30));
    } else if (is1stTo3rdOpen) {
      // If open on 1st-3rd, window started previous month
      const prevMonthIndex = getPreviousMonth(todayMonth);
      const prevYear = prevMonthIndex === DECEMBER ? todayYear - 1 : todayYear;

      if (prevMonthIndex === FEBRUARY) {
        // If previous month was Feb
        effectiveOpenDate = isLeapYear(prevYear)
          ? new Date(Date.UTC(prevYear, FEBRUARY, 29)) // Opened Feb 29
          : new Date(Date.UTC(todayYear, MARCH, 1)); // Effectively opened Mar 1
        // *** Correction: If prev was non-leap Feb, it opened Mar 1st THIS year
        // Let's adjust the effectiveOpenDate logic for Mar 1-3 slightly
        if (todayMonth === MARCH) {
          // Current month is March
          effectiveOpenDate = isLeapYear(todayYear)
            ? new Date(Date.UTC(todayYear, FEBRUARY, 29))
            : new Date(Date.UTC(todayYear, MARCH, 1));
        } else {
          // Should not happen based on rules, but as fallback:
          effectiveOpenDate = new Date(
            Date.UTC(
              prevYear,
              prevMonthIndex,
              daysInMonth(prevMonthIndex, prevYear)
            )
          );
        }
      } else {
        // Previous month was not Feb
        effectiveOpenDate = new Date(Date.UTC(prevYear, prevMonthIndex, 30)); // Started on 30th of prev month
      }
    }
  }

  // --- Calculate next opening date (using the potentially corrected getNextWindowDate) ---
  // *** Re-evaluating getNextWindowDate correction:
  // If in non-leap Feb (day <= 28), next START should be Mar 30th. Correct.
  // If in Dec (day >= 30), next START should be Jan 30th. Correct.
  // If in Jan (day >= 30), next START is Feb 29(leap) or Mar 1(non-leap). Correct.
  // Looks like the revised getNextWindowDate logic IS correct for finding the next *start*.
  const nextOpenDateObj = getNextWindowDate(watDate);

  // --- Calculate days until open ---
  let daysUntilOpen = 0;
  if (!isOpen) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const todayUTCMidnight = Date.UTC(todayYear, todayMonth, todayDay);

    // Determine the correct UTC midnight of the *actual* next opening
    let nextRealOpenUTCMidnight: number;
    if (todayMonth === FEBRUARY && !isLeapYear(todayYear)) {
      // Special case: In non-leap Feb, it opens Mar 1st
      nextRealOpenUTCMidnight = Date.UTC(todayYear, MARCH, 1);
    } else {
      // Otherwise, it opens on the date calculated by getNextWindowDate
      nextRealOpenUTCMidnight = Date.UTC(
        nextOpenDateObj.getUTCFullYear(),
        nextOpenDateObj.getUTCMonth(),
        nextOpenDateObj.getUTCDate()
      );
    }

    daysUntilOpen = Math.ceil(
      (nextRealOpenUTCMidnight - todayUTCMidnight) / msPerDay
    );
  }

  // --- Determine opensOn and closesOn strings ---
  let displayOpenDate: Date;
  if (isOpen && effectiveOpenDate) {
    displayOpenDate = effectiveOpenDate; // If open, show the date this window started
  } else {
    // If closed, determine the date the window WILL open next
    if (todayMonth === FEBRUARY && !isLeapYear(todayYear)) {
      // Special case: In non-leap Feb, it opens Mar 1st
      displayOpenDate = new Date(Date.UTC(todayYear, MARCH, 1));
    } else {
      // Otherwise, it opens on the date calculated by getNextWindowDate
      displayOpenDate = nextOpenDateObj;
    }
  }

  const displayOpenDay = displayOpenDate.getUTCDate();
  const displayOpenMonth = displayOpenDate.getUTCMonth();
  const displayOpenYear = displayOpenDate.getUTCFullYear();

  const opensOnStr = `🔵 ${getDayWithSuffix(displayOpenDay)} of ${getMonthName(
    displayOpenMonth
  )}`;

  // Determine close date based on the *effective* open date used for display
  let closeDate: Date;
  if (
    displayOpenMonth === FEBRUARY &&
    isLeapYear(displayOpenYear) &&
    displayOpenDay === 29
  ) {
    // Opened Feb 29, closes Mar 3
    closeDate = new Date(Date.UTC(displayOpenYear, MARCH, 3));
  } else if (displayOpenMonth === MARCH && displayOpenDay === 1) {
    // Opened Mar 1 (after non-leap Feb), closes Mar 3
    closeDate = new Date(Date.UTC(displayOpenYear, MARCH, 3));
  } else {
    // Opened on 30th (or Mar 1st?), closes on 3rd of *next* month relative to open month
    // Let's refine this close date logic slightly too, base it on displayOpenMonth
    const closeMonthIndex = getNextMonth(displayOpenMonth);
    const closeYear =
      closeMonthIndex === 0 ? displayOpenYear + 1 : displayOpenYear;
    closeDate = new Date(Date.UTC(closeYear, closeMonthIndex, 3));
  }

  const closesOnStr = `🔴 ${getDayWithSuffix(
    closeDate.getUTCDate()
  )} of ${getMonthName(closeDate.getUTCMonth())}`;

  return {
    isOpen,
    opensOn: opensOnStr,
    closesOn: closesOnStr,
    daysUntilOpen: Math.max(0, daysUntilOpen), // Ensure non-negative
  };
};
