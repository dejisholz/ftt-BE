interface PaymentWindow {
  isOpen: boolean;
  opensOn: string;
  closesOn: string;
  daysUntilOpen: number;
}

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

const getPreviousMonth = (currentMonth: number): number => {
  return currentMonth === 0 ? 11 : currentMonth - 1;
};

const getLastDayOfMonth = (month: number, year: number): number => {
  switch (month) {
    case 1: // February
      return isLeapYear(year) ? 29 : 28;
    case 3: // April
    case 5: // June
    case 8: // September
    case 10: // November
      return 30;
    default:
      return 31;
  }
};

const getDayString = (day: number): string => {
  if (day >= 11 && day <= 13) return `${day}th`;
  const lastDigit = day % 10;
  switch (lastDigit) {
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

export const getPaymentWindowStatus = (): PaymentWindow => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0 = January, 1 = February, etc.
  const currentYear = today.getFullYear();

  const opensNextMonthOn = `🔵 1st of ${getMonthName(
    getNextMonth(currentMonth)
  )}`;
  const closesOn = `🔴 3rd of ${getMonthName(getNextMonth(currentMonth))}`;

  // === February Logic ===
  if (currentMonth === 1) {
    const isLeap = isLeapYear(currentYear);
    const febLastDay = isLeap ? 29 : 28;
    const febOpensOn = isLeap ? `🔵 29th of February` : `🔵 1st of March`;
    const febClosesOn = `🔴 3rd of March`;

    if (isLeap) {
      // Leap Year February
      if (currentDay === 29) {
        // Last day (29th) - OPEN
        return {
          isOpen: true,
          opensOn: febOpensOn,
          closesOn: febClosesOn,
          daysUntilOpen: 0,
        };
      } else {
        // Any other day in Feb (Leap) - CLOSED
        return {
          isOpen: false,
          opensOn: febOpensOn,
          closesOn: febClosesOn,
          daysUntilOpen: 29 - currentDay,
        };
      }
    } else {
      // Non-Leap Year February - Always CLOSED in Feb, opens Mar 1st
      return {
        isOpen: false,
        opensOn: febOpensOn, // Which is '1st of March'
        closesOn: febClosesOn,
        daysUntilOpen: febLastDay - currentDay + 1, // Days left in Feb + 1 (for Mar 1st)
      };
    }
  }

  // === March Logic (days 1-3) ===
  // Handles period after February opening
  if (currentMonth === 2 && currentDay <= 3) {
    const isPreviousFebLeap = isLeapYear(currentYear);
    // If previous Feb was leap, it opened Feb 29th. If not, it opened Mar 1st.
    const marchOpensOn = isPreviousFebLeap
      ? `🔵 29th of February`
      : `🔵 1st of March`;
    return {
      isOpen: true,
      opensOn: marchOpensOn,
      closesOn: `🔴 3rd of March`,
      daysUntilOpen: 0,
    };
  }

  // === Regular Month Logic (Not Feb/Mar 1-3) ===
  const lastDayOfCurrentMonth = getLastDayOfMonth(currentMonth, currentYear);
  const opensOnThisMonth = `🔵 30th of ${getMonthName(currentMonth)}`;
  const closesOnNextMonth = `🔴 3rd of ${getMonthName(
    getNextMonth(currentMonth)
  )}`;

  // Check if window is open (30th or 31st OR 1st-3rd of the month)
  if (currentDay >= 30 || currentDay <= 3) {
    // Determine the correct 'opensOn' date based on context
    let effectiveOpensOn = opensOnThisMonth;
    if (currentDay <= 3) {
      // If we are in the first 3 days, the window opened last month
      const prevMonth = getPreviousMonth(currentMonth);
      const lastDayOfPrevMonth = getLastDayOfMonth(prevMonth, currentYear);
      // Special case for March opening after Feb
      if (currentMonth === 2) {
        effectiveOpensOn = isLeapYear(currentYear)
          ? `🔵 29th of February`
          : `🔵 1st of March`;
      } else {
        effectiveOpensOn = `🔵 30th of ${getMonthName(prevMonth)}`;
      }
    }

    return {
      isOpen: true,
      opensOn: effectiveOpensOn,
      closesOn: closesOnNextMonth,
      daysUntilOpen: 0,
    };
  }

  // Otherwise, the window is closed
  return {
    isOpen: false,
    opensOn: opensOnThisMonth,
    closesOn: closesOnNextMonth,
    daysUntilOpen: 30 - currentDay, // Days until the 30th
  };
};
