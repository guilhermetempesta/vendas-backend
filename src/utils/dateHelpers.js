const { zonedTimeToUtc } = require('date-fns-tz');

const timeZone = 'America/Sao_Paulo';

const getCurrentDateBrasil = () => {
  const currentDate = new Date();
  return zonedTimeToUtc(currentDate, timeZone);
}

const getFirstDayOfMonth = () => {
  return zonedTimeToUtc(new Date(getCurrentDateBrasil().getFullYear(), getCurrentDateBrasil().getMonth(), 1), timeZone);
}

const getEndOfToday = () => {
  return zonedTimeToUtc(new Date(getCurrentDateBrasil().getFullYear(), getCurrentDateBrasil().getMonth(), getCurrentDateBrasil().getDate(), 23, 59, 59, 999), timeZone);
}

module.exports = { timeZone, getCurrentDateBrasil, getFirstDayOfMonth, getEndOfToday };
