interface PaymentWindow {
  isOpen: boolean;
  opensOn: string;
  closesOn: string;
  daysUntilOpen: number;
}

// Helper function to get WAT date
const getWATDate = (date: Date = new Date()): Date => {
  // WAT is UTC+1
  // Get UTC time by adding the timezone offset
  const utcMillis = date.getTime() + date.getTimezoneOffset() * 60000;
  // Add 1 hour (3600 * 1000 milliseconds) for WAT
  return new Date(utcMillis + 3600000);
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

const getNextMonth = (currentMonth: number): number => {
  return (currentMonth + 1) % 12;
};

// Added helper function
const getPreviousMonth = (currentMonth: number): number => {
  return currentMonth === 0 ? 11 : currentMonth - 1;
};

const getDayWithSuffix = (day: number): string => {
  if (day > 3 && day < 21) return `${day}th`; // Covers 4th-20th
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

// Refactored to align with new getPaymentWindowStatus logic
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
        return new Date(Date.UTC(currentYear, FEBRUARY, 29)); // Use UTC for date components
      } else {
        // After Feb 29th (or on it), next is March 30th
        return new Date(Date.UTC(currentYear, MARCH, 30));
      }
    } else {
      // Non-leap year: opens March 1st
      return new Date(Date.UTC(currentYear, MARCH, 1));
    }
  }

  // --- March ---
  // Window opens Feb 29/Mar 1 and closes Mar 3. Next is Mar 30.
  if (currentMonth === MARCH) {
    if (currentDay < 30) {
      return new Date(Date.UTC(currentYear, MARCH, 30));
    } else {
      // After March 30th (or on it), next is April 30th
      return new Date(Date.UTC(currentYear, MARCH + 1, 30));
    }
  }

  // --- Other Months ---
  if (currentDay < 30) {
    // If before 30th, next window is 30th of current month
    return new Date(Date.UTC(currentYear, currentMonth, 30));
  } else {
    // On or after 30th, next window is in the next month
    const nextMonthIndex = getNextMonth(currentMonth);
    const nextYear = nextMonthIndex === 0 ? currentYear + 1 : currentYear;

    if (nextMonthIndex === FEBRUARY) {
      // Next month is Feb
      return isLeapYear(nextYear)
        ? new Date(Date.UTC(nextYear, FEBRUARY, 29))
        : new Date(Date.UTC(nextYear, MARCH, 1)); // Non-leap Feb opens Mar 1
    } else {
      // Next month is not Feb
      return new Date(Date.UTC(nextYear, nextMonthIndex, 30));
    }
  }
};

// Replaced with new logic, using WAT and consistent date calculations
export const getPaymentWindowStatus = (): PaymentWindow => {
  const watDate = getWATDate(); // Use current WAT time
  const todayDay = watDate.getDate();
  const todayMonth = watDate.getMonth();
  const todayYear = watDate.getFullYear();

  let isOpen = false;
  let effectiveOpenDate: Date | null = null; // Date the current/most recent window opened

  // --- Determine if window is open NOW and find the effective open date ---

  // Case 1: February (Leap Year) - Open only on 29th
  if (todayMonth === FEBRUARY && isLeapYear(todayYear) && todayDay === 29) {
    isOpen = true;
    effectiveOpenDate = new Date(Date.UTC(todayYear, FEBRUARY, 29));
  }
  // Case 2: March 1st-3rd - Open period after Feb window
  else if (todayMonth === MARCH && todayDay >= 1 && todayDay <= 3) {
    isOpen = true;
    // Determine if the window opening was Feb 29 (leap) or Mar 1 (non-leap)
    const isPrevFebLeap = isLeapYear(todayYear); // Feb is in the same year as Mar
    effectiveOpenDate = isPrevFebLeap
      ? new Date(Date.UTC(todayYear, FEBRUARY, 29))
      : new Date(Date.UTC(todayYear, MARCH, 1));
  }
  // Case 3: Any other month - Open on 30th
  else if (todayMonth !== FEBRUARY && todayMonth !== MARCH && todayDay === 30) {
    isOpen = true;
    effectiveOpenDate = new Date(Date.UTC(todayYear, todayMonth, 30));
  }
  // Case 4: Any other month - Open on 1st-3rd (following a 30th opening)
  else if (
    todayMonth !== FEBRUARY &&
    todayMonth !== MARCH &&
    todayDay >= 1 &&
    todayDay <= 3
  ) {
    isOpen = true;
    // Window opened on 30th of the *previous* month
    const prevMonthIndex = getPreviousMonth(todayMonth);
    const prevYear = prevMonthIndex === 11 ? todayYear - 1 : todayYear; // Handle year change Dec->Jan
    effectiveOpenDate = new Date(Date.UTC(prevYear, prevMonthIndex, 30));
  }

  // --- Calculate next opening date and days until open ---
  const nextOpenDateObj = getNextWindowDate(watDate);
  let daysUntilOpen = 0;

  if (!isOpen) {
    const msPerDay = 1000 * 60 * 60 * 24;
    // Use UTC midnight of WAT date for calculation day difference correctly
    const todayUTCMidnight = Date.UTC(todayYear, todayMonth, todayDay);
    const nextOpenUTCMidnight = Date.UTC(
      nextOpenDateObj.getUTCFullYear(),
      nextOpenDateObj.getUTCMonth(),
      nextOpenDateObj.getUTCDate()
    );
    daysUntilOpen = Math.ceil(
      (nextOpenUTCMidnight - todayUTCMidnight) / msPerDay
    );
  }

  // --- Determine opensOn and closesOn strings ---
  // If closed, the 'opensOn' refers to the *next* window
  if (!effectiveOpenDate) {
    effectiveOpenDate = nextOpenDateObj;
  }

  const openDay = effectiveOpenDate.getUTCDate();
  const openMonth = effectiveOpenDate.getUTCMonth();
  const openYear = effectiveOpenDate.getUTCFullYear();

  const opensOnStr = `🔵 ${getDayWithSuffix(openDay)} of ${getMonthName(
    openMonth
  )}`;

  // Determine close date
  let closeDate: Date;
  if (openMonth === FEBRUARY && isLeapYear(openYear) && openDay === 29) {
    // Feb 29 opens, closes Mar 3
    closeDate = new Date(Date.UTC(openYear, MARCH, 3));
  } else if (openMonth === MARCH && openDay === 1) {
    // Mar 1 opens (after non-leap Feb), closes Mar 3
    closeDate = new Date(Date.UTC(openYear, MARCH, 3));
  } else {
    // Opens on 30th, closes on 3rd of *next* month
    const closeMonthIndex = getNextMonth(openMonth);
    const closeYear = closeMonthIndex === 0 ? openYear + 1 : openYear;
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
