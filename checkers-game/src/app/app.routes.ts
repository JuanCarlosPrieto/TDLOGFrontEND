import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Login } from '../components/login/login';
import { Signup } from '../components/signup/signup';


export const routes: Routes = [
    {path: 'signup', component: Signup},
    {path: 'login', component: Login},
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
