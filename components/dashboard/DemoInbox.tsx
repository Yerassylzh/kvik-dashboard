'use client';

import React, { useState } from 'react';

export function DemoInbox() {
  const [selectedChat, setSelectedChat] = useState('1');

  const chats = [
    {
      id: '1',
      name: 'Арман Сериков',
      phone: '+7 (701) 948-22-11',
      lastMsg: 'Хорошо, давайте завтра в 15:00',
      time: '12:45',
      badge: 'Запись подтверждена',
      unread: false,
    },
    {
      id: '2',
      name: 'Динара Нурланова',
      phone: '+7 (777) 310-44-88',
      lastMsg: 'А есть ли окно в среду после 14:00?',
      time: '11:20',
      badge: 'Квалификация',
      unread: true,
    },
    {
      id: '3',
      name: 'Бауржан Аскаров',
      phone: '+7 (705) 555-12-34',
      lastMsg: 'Отправьте, пожалуйста, прайс на массаж',
      time: '09:15',
      badge: 'Прайс-лист',
      unread: false,
    },
  ];

  return (
    <div className="h-[calc(100vh-140px)] border border-border rounded-2xl bg-card overflow-hidden flex flex-col md:flex-row shadow-sm">
      {/* Chat List Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-muted/20">
        <div className="p-4 border-b border-border font-bold text-sm text-foreground flex items-center justify-between">
          <span>Входящие диалоги WhatsApp (3)</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="divide-y divide-border overflow-y-auto flex-1 themed-scroll">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 cursor-pointer ${
                selectedChat === chat.id ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600' : ''
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white font-bold flex items-center justify-center flex-shrink-0">
                {chat.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground truncate">{chat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{chat.lastMsg}</p>
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {chat.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Top Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center">
              А
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Арман Сериков (+7 701 948-22-11)</h3>
              <p className="text-[11px] text-emerald-600 font-semibold">ИИ-Автоответчик ведет диалог (WhatsApp)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 font-bold text-xs hover:bg-amber-500/20 transition-all">
              🖐 Перехватить диалог человеку
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 themed-scroll bg-slate-950 text-white font-sans text-xs">
          <div className="flex justify-center">
            <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px]">
              Сегодня, WhatsApp Web API Connector
            </span>
          </div>

          {/* Incoming */}
          <div className="flex flex-col items-start max-w-[80%]">
            <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700">
              Здравствуйте! Хочу подстричься. Сколько стоит и когда есть свободное время?
            </div>
            <span className="text-[9px] text-slate-500 mt-1">12:40</span>
          </div>

          {/* AI Response */}
          <div className="flex flex-col items-end max-w-[85%] ml-auto">
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white rounded-tr-none space-y-2 shadow-md">
              <p>Здравствуйте, Арман! 👋 Мужская стрижка — <b>5 000 ₸</b>, около 60 минут.</p>
              <p>📅 Свободные окна: <b>сегодня в 18:30</b> или <b>завтра в 11:00 и 15:00</b>.</p>
              <p>Какое время вам удобно?</p>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
              <span>🤖 Kvik AI Agent</span> · 12:41
            </span>
          </div>

          {/* Incoming */}
          <div className="flex flex-col items-start max-w-[80%]">
            <div className="p-3.5 rounded-2xl bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700">
              Да, отлично! Давайте завтра в 15:00. Подскажите точный адрес.
            </div>
            <span className="text-[9px] text-slate-500 mt-1">12:44</span>
          </div>

          {/* AI Response */}
          <div className="flex flex-col items-end max-w-[85%] ml-auto">
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white rounded-tr-none space-y-2 shadow-md">
              <p>Замечательно! Записал вас на завтра, в 15:00 🗓️</p>
              <p>📍 Адрес: г. Алматы, пр. Достык 120, 2 этаж.</p>
              <p>За день до визита отправлю напоминание. Ждём вас!</p>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
              <span>🤖 Kvik AI Agent</span> · 12:45
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-card flex items-center gap-2">
          <input
            type="text"
            placeholder="Напишите сообщение от имени менеджера..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-indigo-600"
          />
          <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all">
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
