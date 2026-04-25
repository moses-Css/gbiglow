<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{

    function show(): Response {
        return Inertia::render('settings/two-factor');
    }
}
