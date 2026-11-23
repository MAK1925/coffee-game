import asyncio
import logging
import os
from aiohttp import web
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

# Имя переменной изменено на TOKEN
TOKEN = '9038251037:AAGg0s_FNU2mCHwJIlcJVmlXXxOczIJWJ1E'
GAME_URL = 'https://mak1925.github.io/coffee-game/index.html'

logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN)
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

async def handle(request):
    return web.Response(text="Bot is running")

async def start_web_server():
    app = web.Application()
    app.router.add_get('/', handle)
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.environ.get("PORT", 8080))
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()

async def main():
    await start_web_server()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
