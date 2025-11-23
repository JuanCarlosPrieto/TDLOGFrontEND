import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Login } from '../components/login/login';
import { Signup } from '../components/signup/signup';
import { Profile } from '../components/profile/profile';


export const routes: Routes = [
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
