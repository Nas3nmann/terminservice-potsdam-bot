import puppeteer from 'puppeteer';

// const browser = await puppeteer.launch({headless: false, slowMo: false});
const browser = await puppeteer.launch();
const [page] = await browser.pages();
await page.goto('https://egov.potsdam.de/tnv/bgr');

const appointmentButton = await page.locator('#action_officeselect_termnew_prefix1333626470');
await appointmentButton.click();

const concerns = [{id: '1333626504', count: 2}, {id: '1337591238', count: 1}];
for (const concern of concerns) {
    const concernSelection = await page.locator(`#id_${concern.id}`).waitHandle();
    await concernSelection.select(`${concern.count}`);
}

const concernNextButton = await page.locator('#action_concernselect_next');
await concernNextButton.click();

const commentsNextButton = await page.locator('#action_concerncomments_next');
await commentsNextButton.click();

await page.waitForSelector('#id_buergerneuerterminzeitpunkt_caldayselect', {visible: true});
await page.waitForSelector('#cssconstantswaiting-container', {hidden: true});

// await page.locator('[id^="action_calendarview"][id*="forward"]').click();
// await page.waitForNetworkIdle()
//
// await page.locator('[id^="action_calendarview"][id*="forward"]').click();
// await page.waitForNetworkIdle()
//
// await page.locator('[id^="action_calendarview"][id*="forward"]').click();
// await page.waitForNetworkIdle()

const freeAppointmentSlots = await page.$$eval('[id^="action_calendarview"][id*="day_select"]>div.ekolCalendar_FreeTimeContainer', (containers) => {
    const contentBlacklist = ['0 frei', 'geschlossen'];
    return containers
        .filter((container) => !contentBlacklist.some(item => container.textContent === item))
        .map(container => (container.parentElement))
        .map(element => {
            const parts = element.textContent.split('.');
            return {
                date: parts[0].concat('.', parts[1], '.'),
                freeSlots: parts[2]
            }
        });
});
console.table(freeAppointmentSlots);

await browser.close()
