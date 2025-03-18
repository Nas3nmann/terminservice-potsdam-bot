import {Telegraf} from 'telegraf';
import {registerTeardown} from "./teardown.js";

const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;
let telegraf;

function setUpTelegraf() {
    telegraf = new Telegraf(botToken);
}

export async function sendViaTelegram(message) {
    if (!telegraf) {
        setUpTelegraf();
        registerTeardown(() => {
            sendViaTelegram('Unexpected shutdown');
            return telegraf.close();
        });
    }

    if (botToken && chatId) {
        await telegraf.telegram.sendMessage(chatId, message);
    } else {
        console.table(message);
    }
}

export async function sendAppointmentsViaTelegram(freeAppointments) {
    let message = `[${new Date().toLocaleDateString()}] New appointments found:\n${freeAppointments.map(appointment => `${appointment.date}: ${appointment.freeSlots}`).join('\n')}`;
    await sendViaTelegram(message);
}
