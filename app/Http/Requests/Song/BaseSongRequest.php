<?php

namespace App\Http\Requests\Song;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class BaseSongRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->main_role === 'admin';
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'publisher'    => ['nullable', 'string', 'max:100'],
            'page_number'  => ['required', 'integer', 'min:1'],
            'status'       => ['required', Rule::in(['printed', 'not_printed'])],
            'folder_id'    => ['required', 'integer', 'exists:folders,id'],
            'youtube_link' => ['nullable', 'url', 'max:500'],
            'sheet_file'   => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'folder_id.exists' => 'Folder tidak ditemukan.',
            'page_number.min'  => 'Nomor halaman minimal 1.',
            'status.in'        => 'Status harus printed atau not_printed.',
        ];
    }
}