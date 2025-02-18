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

const getNextMonth = (currentMonth: number): number => {
  return (currentMonth + 1) % 12;
};

const FEBRUARY = 1; // 0-based month indexing

export const getNextWindowDate = (currentDate: Date): Date => {
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // If we're in February
  if (currentMonth === FEBRUARY) {
    const lastFebDay = isLeapYear(currentYear) ? 29 : 28;
    // If we're before the last day of February
    if (currentDay < lastFebDay) {
      return new Date(currentYear, FEBRUARY, lastFebDay);
    }
    // If we're on or after the last day of February
    return new Date(currentYear, FEBRUARY + 1, 30);
  }

  // If we're before the 30th of current month
  if (currentDay < 30) {
    return new Date(currentYear, currentMonth, 30);
  }
  
  // If we're at or after the 30th, get next month's date
  const nextMonth = getNextMonth(currentMonth);
  const nextYear = nextMonth === 0 ? currentYear + 1 : currentYear;
  
  // If next month is February
  if (nextMonth === FEBRUARY) {
    return isLeapYear(nextYear) 
      ? new Date(nextYear, FEBRUARY, 29)
      : new Date(nextYear, FEBRUARY, 28);
  }
  
  return new Date(nextYear, nextMonth, 30);
};

export const getPaymentWindowStatus = (): PaymentWindow => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Get next window date for comparison
  const nextOpenDate = getNextWindowDate(today);

  // Determine if window is open
  const isOpen = 
    // February special cases
    (currentMonth === FEBRUARY && (
      (isLeapYear(currentYear) && currentDay === 29) || 
      (!isLeapYear(currentYear) && currentDay === 28)
    )) ||
    // Regular months
    (currentMonth !== FEBRUARY && (
      // Open on 30th
      currentDay === 30 ||
      // Or first 3 days of next month
      (currentDay <= 3 && currentMonth === getNextMonth((nextOpenDate.getMonth() + 11) % 12))
    ));

  // Calculate days until next window
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayMidnight = new Date(currentYear, currentMonth, currentDay).getTime();
  const nextDateMidnight = new Date(
    nextOpenDate.getFullYear(),
    nextOpenDate.getMonth(),
    nextOpenDate.getDate()
  ).getTime();
  
  const rawDaysUntilOpen = Math.ceil((nextDateMidnight - todayMidnight) / msPerDay);
  const daysUntilOpen = isOpen ? 0 : Math.max(0, rawDaysUntilOpen);

  // Format the response
  const opensDay = nextOpenDate.getDate();
  const opensMonth = nextOpenDate.getMonth();
  const closesMonth = getNextMonth(opensMonth);
  const dayString = opensDay === 1 ? '1st' : `${opensDay}th`;

  return {
    isOpen,
    opensOn: `🔵 ${dayString} of ${getMonthName(opensMonth)}`,
    closesOn: `🔴 3rd of ${getMonthName(closesMonth)}`,
    daysUntilOpen
  };
}; 