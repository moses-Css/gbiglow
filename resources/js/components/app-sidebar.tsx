import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { Music, Calendar, LayoutDashboard, FolderGit2, BookOpen, Folder, ListMusic } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as songsIndex } from '@/routes/songs';
import { index as schedulesIndex } from '@/routes/schedules';
import { index as foldersIndex } from '@/routes/folders';
import { index as audioSongsIndex } from '@/routes/audio-songs';

import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Songs',
        href: songsIndex(),
        icon: Music,
    },
    {
        title: 'Audio Library',
        href: audioSongsIndex(),
        icon: ListMusic,
    },
    {
        title: 'Schedules',
        href: schedulesIndex(),
        icon: Calendar,
    },
    {
        title: 'Folders',
        href: foldersIndex(),
        icon: Folder,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}