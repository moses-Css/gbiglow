<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroySongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:songs,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'No songs selected.',
            'ids.min'      => 'Select at least one song to delete.',
            'ids.*.exists' => 'One or more selected songs do not exist.',
        ];
    }
}