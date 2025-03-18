import cron from 'node-cron';
import {scrapeAppointments} from './scrape-appointments.js';
import {sendAppointmentsViaTelegram, sendViaTelegram} from "./telegram-bot.js";
import {isEqual} from "lodash-es";
import {registerTeardown} from "./teardown.js";

let latestFreeAppointments = [];

const runEveryNMinutes = process.env.RUN_EVERY_N_MINUTES || 10;
const scheduledTask = cron.schedule(`*/${runEveryNMinutes} * * * *`, () => checkForFreeAppointments());
registerTeardown(() => scheduledTask.stop())

async function checkForFreeAppointments() {
    let freeAppointments = []
    try {
        freeAppointments = await scrapeAppointments();
    } catch (error) {
        console.error(error);
    }

    if (!isEqual(latestFreeAppointments, freeAppointments)) {
        if(freeAppointments.length > 0) {
            await sendAppointmentsViaTelegram(freeAppointments);
        } else {
            await sendViaTelegram('Currently no free appointments.');
        }
        latestFreeAppointments = freeAppointments;
    }
}
