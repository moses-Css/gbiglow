<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;

class CheckDuplicateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'title'     => ['required', 'string', 'max:255'],
            'publisher' => ['nullable', 'string', 'max:100'],
        ];
    }
}