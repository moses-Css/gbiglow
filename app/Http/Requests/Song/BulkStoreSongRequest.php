<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreSongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'songs'                => ['required', 'array', 'min:1', 'max:200'],
            'songs.*.title'        => ['required', 'string', 'max:255'],
            'songs.*.publisher'    => ['nullable', 'string', 'max:100'],
            'songs.*.page_number'  => ['required', 'integer', 'min:1'],
            'songs.*.status'       => ['required', Rule::in(['printed', 'not_printed'])],
            'songs.*.folder_id'    => ['required', 'integer', 'exists:folders,id'],
            'songs.*.description'  => ['nullable', 'string'],
            'songs.*.force_action' => ['nullable', Rule::in(['overwrite', 'make_version', 'skip'])],
        ];
    }

    public function messages(): array
    {
        return [
            'songs.required'              => 'No songs provided.',
            'songs.min'                   => 'At least one song is required.',
            'songs.max'                   => 'Maximum 200 songs per bulk upload.',
            'songs.*.title.required'      => 'Each song must have a title.',
            'songs.*.page_number.required' => 'Each song must have a page number.',
            'songs.*.page_number.min'     => 'Page number must be at least 1.',
            'songs.*.folder_id.required'  => 'Each song must be assigned to a folder.',
            'songs.*.folder_id.exists'    => 'One or more folders do not exist.',
            'songs.*.status.in'           => 'Status must be printed or not_printed.',
            'songs.*.force_action.in'     => 'Invalid action. Must be overwrite, make_version, or skip.',
        ];
    }
}