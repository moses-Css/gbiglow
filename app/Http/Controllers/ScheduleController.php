<?php

namespace App\Http\Controllers;

use App\Http\Requests\Schedule\StoreScheduleRequest;
use App\Http\Requests\Schedule\UpdateScheduleRequest;
use App\Models\Schedule;
use App\Models\Song;
use App\Services\ScheduleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __construct(private readonly ScheduleService $scheduleService) {}

    public function index(Request $request): Response
    {
        $schedules = Schedule::query()
            ->with(['creator:id,name', 'copiedFrom:id,event_name'])
            ->withCount('sessions')
            ->when(
                $request->filled('category') && $request->string('category') !== 'all',
                fn($q) => $q->where('category', $request->string('category'))
            )
            ->orderBy('event_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('schedules/index', [
            'schedules'  => $schedules,
            'categories' => Schedule::distinct()->pluck('category'),
            'filters'    => $request->only(['category']),
        ]);
    }

    public function store(StoreScheduleRequest $request): RedirectResponse
    {
        $schedule = $this->scheduleService->createSchedule(
            $request->validated(),
            $request->user()->id,
        );

        return redirect()->route('schedules.show', $schedule)
            ->with('success', 'Schedule created.');
    }

    public function show(Schedule $schedule): Response
    {
        $schedule->load([
            'sessions.songs.folder:id,name,color_code',
            'creator:id,name',
            'copiedFrom:id,event_name,event_date',
        ]);

        return Inertia::render('schedules/show', [
            'schedule' => $schedule,
            'allSongs' => Song::select(['id', 'title', 'publisher', 'folder_id', 'page_number'])
                ->with('folder:id,name,color_code')
                ->orderBy('title')
                ->get(),
        ]);
    }

    public function update(UpdateScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        $this->scheduleService->updateSchedule($schedule, $request->validated());

        return redirect()->route('schedules.show', $schedule)
            ->with('success', 'Schedule updated.');
    }

    public function destroy(Schedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->route('schedules.index')
            ->with('success', 'Schedule deleted.');
    }

    public function copy(Schedule $schedule): RedirectResponse
    {
        $clone = $this->scheduleService->copySchedule($schedule, request()->user()->id);

        return redirect()->route('schedules.show', $clone)
            ->with('success', 'Schedule copied.');
    }
}