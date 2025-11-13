export interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  external?: boolean;
  highlight?: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
