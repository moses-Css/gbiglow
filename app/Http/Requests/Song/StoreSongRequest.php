<?php

namespace App\Http\Requests\Song;

use Illuminate\Validation\Rule;

class StoreSongRequest extends BaseSongRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'force_action' => ['nullable', 'string', Rule::in(['overwrite', 'make_version'])],
        ]);
    }
}