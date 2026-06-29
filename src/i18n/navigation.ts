import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Helpers de navegación localizada (Link, useRouter, redirect, usePathname).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
