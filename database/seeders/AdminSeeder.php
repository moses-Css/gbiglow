<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'username' => 'superadmin',
            'name' => 'Super Admin',
            'email' => 'admin@glowvault.com',
            'password' => Hash::make('pass123123123'),
            'main_role' => 'admin',
            'is_active' => true,
        ]);
    }
}
