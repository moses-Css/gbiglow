<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;

class CheckPageConflictRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'folder_id'   => ['required', 'integer', 'exists:folders,id'],
            'page_number' => ['required', 'integer', 'min:1'],
            'exclude_id'  => ['nullable', 'integer', 'exists:songs,id'],
        ];
    }
}