<?php

namespace App\Services;

use App\Models\Schedule;
use App\Models\ScheduleSession;

class ScheduleService
{
    // ── Create ────────────────────────────────────────────────────────────────

    public function createSchedule(array $data, int $userId): Schedule
    {
        $schedule = Schedule::create([
            ...$data,
            'user_id' => $userId,
        ]);

        if (!empty($data['copied_from_id'])) {
            $source = Schedule::with('sessions.songs')->findOrFail($data['copied_from_id']);
            $schedule->inheritSongsFrom($source);
        } else {
            $this->createDefaultSession($schedule);
        }

        return $schedule;
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function updateSchedule(Schedule $schedule, array $data): Schedule
    {
        $schedule->update($data);

        if (isset($data['sessions'])) {
            $this->syncSessions($schedule, $data['sessions']);
        }

        return $schedule->fresh(['sessions.songs']);
    }

    // ── Copy ──────────────────────────────────────────────────────────────────

    public function copySchedule(Schedule $source, int $userId): Schedule
    {
        $clone = Schedule::create([
            'event_name'    => $source->event_name . ' (Copy)',
            'event_date'    => $source->event_date,
            'category'      => $source->category,
            'type'          => $source->type,
            'color_primary' => $source->color_primary,
            'color_secondary' => $source->color_secondary,
            'notes'         => $source->notes,
            'is_published'  => false,
            'user_id'       => $userId,
        ]);

        $source->loadMissing('sessions.songs');
        $clone->inheritSongsFrom($source);

        return $clone;
    }

    // ── Sessions sync ─────────────────────────────────────────────────────────

    public function syncSessions(Schedule $schedule, array $sessions): void
    {
        $incomingIds = collect($sessions)->pluck('id')->filter()->all();

        // Delete sessions not in incoming
        $schedule->sessions()
            ->whereNotIn('id', $incomingIds)
            ->delete();

        foreach ($sessions as $index => $sessionData) {
            $session = isset($sessionData['id'])
                ? ScheduleSession::findOrFail($sessionData['id'])
                : $schedule->sessions()->create([
                    'label' => $sessionData['label'] ?? 'Session ' . ($index + 1),
                    'order' => $index,
                ]);

            $session->update([
                'label' => $sessionData['label'] ?? $session->label,
                'order' => $index,
            ]);

            if (isset($sessionData['songs'])) {
                $pivot = collect($sessionData['songs'])
                    ->mapWithKeys(fn($item) => [
                        $item['id'] => [
                            'order' => $item['order'],
                            'notes' => $item['notes'] ?? null,
                        ],
                    ])->toArray();

                $session->songs()->sync($pivot);
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function createDefaultSession(Schedule $schedule): ScheduleSession
    {
        return $schedule->sessions()->create([
            'label' => 'Session 1',
            'order' => 0,
        ]);
    }
}