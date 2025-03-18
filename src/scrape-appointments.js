import puppeteer from 'puppeteer';

async function createBrowser(headless) {
    if (headless) {
        return await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox'],
        });
    } else {
        return await puppeteer.launch({headless: false, slowMo: false});
    }
}

async function navigateToAppointmentCalendar(page) {
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
}

async function scrapeAppointmentsOnPage(page) {
    return await page.$$eval('[id^="action_calendarview"][id*="day_select"]>div.ekolCalendar_FreeTimeContainer', (containers) => {
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
}

async function goToNextPage(page) {
    await page.locator('[id^="action_calendarview"][id*="forward"]').click();
    await page.waitForNetworkIdle()
}

export async function scrapeAppointments(headless = true) {
    let browser = await createBrowser(headless);

    const [page] = await browser.pages();
    await page.goto('https://egov.potsdam.de/tnv/bgr');

    await navigateToAppointmentCalendar(page);

    const allFreeSlots = [];
    const slotsOnFirstPage = await scrapeAppointmentsOnPage(page);
    allFreeSlots.push(...slotsOnFirstPage);
    for (let pageIndex = 1; pageIndex < 4; pageIndex++) {
        await goToNextPage(page);
        const slotsOnPage = await scrapeAppointmentsOnPage(page);
        allFreeSlots.push(...slotsOnPage);
    }

    await page.close()
    await browser.close()

    return allFreeSlots;
}
