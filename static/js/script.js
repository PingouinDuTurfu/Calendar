import { Session } from './Session.js';

const currentSession = new Session();

$(document).ready(function() {
    currentSession.resize()
    currentSession.displayWeekDaysHeader();
    currentSession.displayHeaderMonthAndYear();
});

function createDateFromHtml(date, time) {
    return Date.parse(decodeEntities(date) + ' ' + decodeEntities(time))
}

const decodeEntities = (function() {
  let element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

export { currentSession, createDateFromHtml };