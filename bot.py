import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

BOT_TOKEN = '9038251037:AAECAF4p_C11eA57UwXPAa4qrknbBWM6M08'
GAME_URL = 'https://mak1925.github.io/coffee-game/index.html'

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="☕ Открыть Кофейню", web_app=WebAppInfo(url=GAME_URL))]
    ])

    await message.answer_photo(
        photo="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
        caption="Привет! Добро пожаловать в <b>Кофейню: Империя с нуля</b>! 👋\n\nНажми на кнопку ниже, чтобы начать строить свою кофейную империю.",
        reply_markup=keyboard,
        parse_mode="HTML"
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
