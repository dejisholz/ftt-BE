interface PaymentWindow {
  isOpen: boolean;
  opensOn: string;
  closesOn: string;
  daysUntilOpen: number;
}

const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex % 12];
};

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getNextMonth = (openMonth: number, currentYear: number): number => {
  // Special handling for February

  if (openMonth === 2) { // February is month 1 (0-based)
    return 2;
  }
  // For all other months, increment normally
  return (openMonth + 1) % 12;
};

const getNextWindowDate = (currentDate: Date): Date => {
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // If we're before the 29th of current month (except February)
  if (currentMonth !== 1 && currentDay < 29) {
    return new Date(currentYear, currentMonth, 29);
  }
  
  // If we're in February
  if (currentMonth === 1) {
    if (isLeapYear(currentYear) && currentDay < 29) {
      return new Date(currentYear, 1, 29); // February 29th
    } else {
      return new Date(currentYear, 2, 1); // March 1st
    }
  }

  // console.log("current Month", currentMonth);
  
  // If we're past the 29th or in days 1-5 of next month
  const nextMonth = getNextMonth(currentMonth, currentYear);
  const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
  
  // If next window would be in February
  if (nextMonth === 2) {
    return isLeapYear(nextYear) 
      ? new Date(nextYear, 1, 29)  // February 29th
      : new Date(nextYear, 2, 1);  // March 1st
  }
  
  // Regular case: 29th of next month
  return new Date(nextYear, nextMonth, 29);
};

export const getPaymentWindowStatus = (): PaymentWindow => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const isCurrentYearLeap = isLeapYear(currentYear);

  
  // Determine if window is open
  const isOpen = 
    (currentMonth === 1 && isCurrentYearLeap && currentDay === 29) || // Feb 29 in leap year
    (currentMonth === 2 && currentDay <= 5) || // March 1-5
    (currentMonth !== 1 && currentMonth !== 2 && ( // Other months
      currentDay >= 29 || (currentDay <= 5 && currentMonth === ((today.getMonth() - 1 + 12) % 12 + 1))
    ));

  // Get next window date
  const nextOpenDate = getNextWindowDate(today);
  
  // Calculate days until next window
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayMidnight = new Date(currentYear, currentMonth, currentDay).getTime();
  const nextDateMidnight = new Date(
    nextOpenDate.getFullYear(),
    nextOpenDate.getMonth(),
    nextOpenDate.getDate()
  ).getTime();
  
  const daysUntilOpen = Math.ceil((nextDateMidnight - todayMidnight) / msPerDay);

  // Format the response
  const opensDay = nextOpenDate.getDate();
  const opensMonth = nextOpenDate.getMonth();
  const closesMonth = getNextMonth(opensMonth, currentYear);
  const dayString = opensDay === 1 ? '1st' : `${opensDay}th`;

  return {
    isOpen,
    opensOn: `🔵 ${dayString} of ${getMonthName(opensMonth)}`,
    closesOn: `🔴 5th of ${getMonthName(closesMonth)}`,
    daysUntilOpen
  };
}; 