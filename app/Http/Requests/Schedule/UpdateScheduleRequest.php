<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'event_name'      => ['required', 'string', 'max:255'],
            'event_date'      => ['required', 'date'],
            'category'        => ['required', 'string', 'max:100'],
            'type'            => ['sometimes', Rule::in(['regular', 'multi_session'])],
            'color_primary'   => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'color_secondary' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'notes'           => ['nullable', 'string'],
            'is_published'    => ['boolean'],

            // Sessions & songs — opsional, hanya kalau dikirim
            'sessions'                    => ['sometimes', 'array'],
            'sessions.*.id'               => ['nullable', 'integer', 'exists:schedule_sessions,id'],
            'sessions.*.label'            => ['required_with:sessions', 'string', 'max:50'],
            'sessions.*.songs'            => ['nullable', 'array'],
            'sessions.*.songs.*.id'       => ['required_with:sessions.*.songs', 'integer', 'exists:songs,id'],
            'sessions.*.songs.*.order'    => ['required_with:sessions.*.songs', 'integer', 'min:0'],
            'sessions.*.songs.*.notes'    => ['nullable', 'string', 'max:255'],
        ];
    }
}