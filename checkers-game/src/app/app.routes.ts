import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Login } from '../components/login/login';
import { Signup } from '../components/signup/signup';
import { Profile } from '../components/profile/profile';
import { Gamepage } from '../components/game/gamepage/gamepage';
import { Playpage } from '../components/playpage/playpage';


export const routes: Routes = [
    { path: 'play', component: Playpage },
    { path: 'game', component: Gamepage },
    { path: 'signup', component: Signup },
    { path: 'login', component: Login },
    { path: 'profile', component: Profile },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
