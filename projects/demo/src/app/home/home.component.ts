import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgWhiteboardComponent } from 'ng-whiteboard';
import { HeaderComponent } from '../shared/components/header/header.component';
import { forkJoin, catchError, of } from 'rxjs';

interface GitHubOwner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  html_url: string;
  description: string;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  forks_count: number;
  open_issues_count: number;
  license: GitHubLicense;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  network_count: number;
  subscribers_count: number;
}

interface NpmDownloads {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface Stats {
  stars: number;
  downloads: number;
  forks: number;
  angularVersion: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [HeaderComponent, NgWhiteboardComponent, RouterModule],
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);

  stats = signal<Stats>({
    stars: 62,
    downloads: 400,
    forks: 32,
    angularVersion: '17+',
  });

  ngOnInit(): void {
    this.fetchStats();
  }

  private fetchStats(): void {
    forkJoin({
      github: this.http
        .get<GitHubRepo>('https://api.github.com/repos/mostafazke/ng-whiteboard')
        .pipe(catchError(() => of({ stargazers_count: 62, forks_count: 32 } as GitHubRepo))),
      npm: this.http
        .get<NpmDownloads>('https://api.npmjs.org/downloads/point/last-week/ng-whiteboard')
        .pipe(catchError(() => of({ downloads: 400 } as NpmDownloads))),
    }).subscribe({
      next: (data) => {
        this.stats.set({
          stars: data.github.stargazers_count || 62,
          downloads: data.npm.downloads || 400,
          forks: data.github.forks_count || 32,
          angularVersion: '17+',
        });
      },
      error: () => {
        // Keep default values on error
      },
    });
  }
}
