'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getOnboardingState,
  selectNicheStep,
  submitBusinessProfile,
  submitDataSource,
  getDataPreview,
  confirmDataPreview,
  submitChannel,
  submitQualification,
  completeOnboarding,
} from '@/lib/api/onboarding';
import { useOnboardingStore } from '@/store/onboarding.store';
import {
  NicheProfile,
  OnboardingStepState,
  OnboardingStateResponse,
  BusinessProfileDto,
  ChannelDto,
  QualificationDto,
} from '@/types/niche';

import { StepSelectNiche } from '@/components/onboarding/StepSelectNiche';
import { StepBusinessProfile } from '@/components/onboarding/StepBusinessProfile';
import { StepDataSource } from '@/components/onboarding/StepDataSource';
import { StepDataPreview } from '@/components/onboarding/StepDataPreview';
import { StepConnectChannel } from '@/components/onboarding/StepConnectChannel';
import { StepQualification } from '@/components/onboarding/StepQualification';
import { StepCompleteTest } from '@/components/onboarding/StepCompleteTest';

const STEP_TITLES: Record<OnboardingStepState, { index: number; title: string; subtitle: string }> = {
  SELECT_NICHE: { index: 0, title: 'Выбор ниши бизнеса', subtitle: 'Выберите сферу вашей деятельности для активации специализированного ИИ' },
  BUSINESS_PROFILE: { index: 1, title: 'Профиль бизнеса', subtitle: 'Укажите основную информацию о вашем агентстве или компании' },
  DATA_SOURCE: { index: 2, title: 'Подключение Krisha.kz', subtitle: 'Укажите ID пользователя или агентства для автоимпорта объявлений' },
  DATA_PREVIEW: { index: 3, title: 'Импорт и просмотр объектов', subtitle: 'ИИ автоматически парсит и структурирует ваши объявления в базу знаний' },
  CONNECT_CHANNEL: { index: 4, title: 'Подключение мессенджера', subtitle: 'Подключите WhatsApp или Instagram для автоответов клиентам' },
  QUALIFICATION: { index: 5, title: 'Правила квалификации ИИ', subtitle: 'Настройте вопросы, которые ИИ будет задавать покупателям' },
  COMPLETE_TEST: { index: 6, title: 'Тестирование и запуск', subtitle: 'Протестируйте диалог с ИИ-агентом и активируйте его' },
  DONE: { index: 7, title: 'Завершено', subtitle: 'Перенаправление в дашборд...' },
};

const TOTAL_STEPS = 7;

/**
 * Бэкенд держит raw step = DATA_SOURCE, пока воркер не запишет первую запись,
 * хотя парсинг уже идёт. Показываем экран превью (с прогрессом), как только
 * парсинг стартовал (parsingStatus вышел из IDLE).
 */
function resolveDisplayStep(
  step: OnboardingStepState,
  parsingStatus?: OnboardingStateResponse['parsingStatus']
): OnboardingStepState {
  if (step === 'DATA_SOURCE' && parsingStatus && parsingStatus !== 'IDLE') {
    return 'DATA_PREVIEW';
  }
  return step;
}

export default function OnboardingPage() {
  const router = useRouter();
  const store = useOnboardingStore();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Применяем состояние из ЛЮБОГО ответа бэкенда (GET /state или POST-шаги).
  const applyState = useCallback(
    (res: OnboardingStateResponse): boolean => {
      if (res.step === 'DONE') {
        router.push('/dashboard');
        return true;
      }
      const display = resolveDisplayStep(res.step, res.parsingStatus);
      store.setStepState(display, STEP_TITLES[display].index);

      if (res.parsingStatus) {
        store.setDataPreview({
          parsingStatus: res.parsingStatus,
          parsedCount: res.parsedCount ?? 0,
          totalCount: res.totalCount ?? 0,
          failedCount: res.failedCount ?? 0,
          error: res.error,
        });
      }
      return false;
    },
    // store-методы стабильны у zustand; router стабилен
    [router, store]
  );

  // Загрузка начального состояния с бэкенда (источник истины).
  // Async-IIFE: любые setState происходят только ПОСЛЕ первого await —
  // это не синхронный setState в теле эффекта (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stateRes = await getOnboardingState();
        if (cancelled) return;
        applyState(stateRes);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Ошибка загрузки состояния онбординга');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling превью парсинга: крутим, пока показан экран DATA_PREVIEW,
  // и останавливаемся, когда воркер выставил DONE или FAILED.
  useEffect(() => {
    if (store.step !== 'DATA_PREVIEW') return;

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const res = await getDataPreview();
        if (cancelled) return;

        store.setDataPreview({
          parsingStatus: res.parsingStatus,
          parsedCount: res.parsedCount,
          totalCount: res.totalCount,
          failedCount: res.failedCount ?? 0,
          error: res.error,
          entries: res.entries || [],
        });

        // Завершение ловим по авторитетному статусу воркера, не по счётчикам.
        if (res.parsingStatus === 'DONE' || res.parsingStatus === 'FAILED') {
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        if (cancelled) return;
        // Не роняем флоу из-за одного сбоя опроса, но и не молчим.
        setError(err instanceof Error ? err.message : 'Ошибка получения статуса импорта');
      }
    };

    tick();
    interval = setInterval(tick, 2500);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.step]);

  // --- Handlers ---
  const handleSelectNiche = async (niche: NicheProfile) => {
    try {
      setActionLoading(true);
      setError(null);
      store.setNicheProfile(niche);
      applyState(await selectNicheStep(niche));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения ниши');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitBusinessProfile = async (data: BusinessProfileDto) => {
    try {
      setActionLoading(true);
      setError(null);
      store.setBusinessProfile(data);
      applyState(await submitBusinessProfile(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения профиля');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDataSource = async (userId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      store.setKrishaUserId(userId);
      // Сбрасываем прошлое превью, парсинг стартует заново.
      store.setDataPreview({
        parsingStatus: 'QUEUED',
        parsedCount: 0,
        totalCount: 0,
        failedCount: 0,
        error: undefined,
        entries: [],
      });
      applyState(await submitDataSource({ userId }));
      // Даже если бэкенд ещё держит step=DATA_SOURCE, показываем превью с прогрессом.
      store.setStepState('DATA_PREVIEW', STEP_TITLES.DATA_PREVIEW.index);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ID пользователя не найден на Krisha.kz');
      // Возвращаем на форму ввода ID.
      store.setStepState('DATA_SOURCE', STEP_TITLES.DATA_SOURCE.index);
    } finally {
      setActionLoading(false);
    }
  };

  // Повторный запуск парсинга (после FAILED) с тем же ID.
  const handleRetryDataSource = () => handleSubmitDataSource(store.krishaUserId);

  // Вернуться к форме ввода ID (изменить ID).
  const handleEditDataSource = () => {
    setError(null);
    store.setDataPreview({
      parsingStatus: 'IDLE',
      parsedCount: 0,
      totalCount: 0,
      failedCount: 0,
      error: undefined,
      entries: [],
    });
    store.setStepState('DATA_SOURCE', STEP_TITLES.DATA_SOURCE.index);
  };

  const handleConfirmDataPreview = async () => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await confirmDataPreview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подтверждения данных');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnectChannel = async (type: ChannelDto['type']) => {
    try {
      setActionLoading(true);
      setError(null);
      // Реальный OAuth/QR — Фаза 4. Пока помечаем канал как подключённый вручную,
      // бэкенду достаточно непустого объекта credentials для создания Channel.
      applyState(await submitChannel({ type, credentials: { connectedVia: 'onboarding' } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения канала');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQualification = async (data: QualificationDto) => {
    try {
      setActionLoading(true);
      setError(null);
      applyState(await submitQualification(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения правил квалификации');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await completeOnboarding();
      // Бэкенд разрешает complete только на шаге COMPLETE_TEST и вернёт DONE.
      if (!applyState(res)) {
        // На всякий случай: если бэкенд не вернул DONE, синхронизируемся.
        applyState(await getOnboardingState());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка активации бота');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Загрузка данных онбординга...</p>
      </div>
    );
  }

  const currentMeta = STEP_TITLES[store.step] || STEP_TITLES.SELECT_NICHE;
  const currentStepIdx = currentMeta.index;
  const progressPercent = Math.min(100, Math.round(((currentStepIdx + 1) / TOTAL_STEPS) * 100));

  return (
    <div className="w-full flex flex-col items-center">
      {/* Progress Bar */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Шаг {currentStepIdx + 1} из {TOTAL_STEPS}</span>
          <span className="text-indigo-400 font-bold">{progressPercent}% Завершено</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Title & Subtitle */}
      <div className="text-center mb-8 max-w-xl px-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{currentMeta.title}</h1>
        <p className="text-sm text-slate-400 mt-2">{currentMeta.subtitle}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Glass Card */}
      <div className="w-full max-w-3xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        {store.step === 'SELECT_NICHE' && (
          <StepSelectNiche onSelect={handleSelectNiche} loading={actionLoading} />
        )}
        {store.step === 'BUSINESS_PROFILE' && (
          <StepBusinessProfile
            initialValues={store.businessProfile}
            onSubmit={handleSubmitBusinessProfile}
            loading={actionLoading}
          />
        )}
        {store.step === 'DATA_SOURCE' && (
          <StepDataSource
            initialKrishaUserId={store.krishaUserId}
            onSubmit={handleSubmitDataSource}
            loading={actionLoading}
          />
        )}
        {store.step === 'DATA_PREVIEW' && (
          <StepDataPreview
            dataPreview={store.dataPreview}
            onConfirm={handleConfirmDataPreview}
            onRetry={handleRetryDataSource}
            onEditId={handleEditDataSource}
            loading={actionLoading}
          />
        )}
        {store.step === 'CONNECT_CHANNEL' && (
          <StepConnectChannel onConnect={handleConnectChannel} loading={actionLoading} />
        )}
        {store.step === 'QUALIFICATION' && (
          <StepQualification onSubmit={handleSubmitQualification} loading={actionLoading} />
        )}
        {store.step === 'COMPLETE_TEST' && (
          <StepCompleteTest onComplete={handleComplete} loading={actionLoading} />
        )}
      </div>
    </div>
  );
}
