import puppeteer from 'puppeteer';
import {Telegraf} from "telegraf";
import cron from 'node-cron';

async function scrapeAppointments() {
    // const browser = await puppeteer.launch({headless: false, slowMo: false});
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox'],
    });
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

    await page.close()
    await browser.close()
    return freeAppointmentSlots;
}

async function sendViaTelegram(message) {
    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
        const telegraf = new Telegraf(process.env.BOT_TOKEN);
        await telegraf.telegram.sendMessage(process.env.CHAT_ID, message);
        await telegraf.stop();
    } else {
        console.table(message);
    }
}

async function sendAppointmentsViaTelegram(freeAppointments) {
    let message = `[${new Date().toLocaleDateString()}] New appointments found:\n${freeAppointments.map(appointment => `${appointment.date}: ${appointment.freeSlots}`).join('\n')}`;
    await sendViaTelegram(message);
}


async function checkForFreeAppointments() {
    let freeAppointments = []
    try {
        freeAppointments = await scrapeAppointments();
    } catch (error) {
        console.error(error);
    }

    if (freeAppointments.length > 0) {
        await sendAppointmentsViaTelegram(freeAppointments);
    }
}

const scheduledTasks = [];
scheduledTasks.push(cron.schedule('*/2 * * * *', () => checkForFreeAppointments()));
scheduledTasks.push(cron.schedule('0 9 * * *', () => sendViaTelegram('Good morning. No new appointments yet.')));
scheduledTasks.push(cron.schedule('0 20 * * *', () => sendViaTelegram('Good evening. No new appointments yet.')));

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
    process.on(eventType, (args) => {
        sendViaTelegram(`Process interrupted: ${args}`);
        scheduledTasks.forEach(task => task.stop());
    });
})
