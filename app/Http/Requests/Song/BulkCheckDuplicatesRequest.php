<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;

class BulkCheckDuplicatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'songs'            => ['required', 'array', 'min:1'],
            'songs.*.title'    => ['required', 'string', 'max:255'],
            'songs.*.publisher'=> ['nullable', 'string', 'max:100'],
        ];
    }
}