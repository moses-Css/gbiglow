<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;

class SuggestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'field' => ['required', 'string', 'in:title,publisher'],
            'q'     => ['required', 'string', 'min:2', 'max:100'],
        ];
    }
}