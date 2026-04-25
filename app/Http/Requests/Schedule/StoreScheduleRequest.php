<?php

namespace App\Http\Requests\Schedule;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreScheduleRequest extends FormRequest
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
            'type'            => ['required', Rule::in(['regular', 'multi_session'])],
            'color_primary'   => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'color_secondary' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'notes'           => ['nullable', 'string'],
            'is_published'    => ['boolean'],
            'copied_from_id'  => ['nullable', 'integer', 'exists:schedules,id'],
        ];
    }
}