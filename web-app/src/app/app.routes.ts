import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ViewAssessmentComponent } from './pages/viewassessment/viewassessment.component';
import { AddAssessmentComponent } from './pages/addassessment/addassessment.component';
import { EditAssessmentComponent } from './pages/editassessment/editassessment.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
    {
        path: '',redirectTo: 'login', pathMatch: 'full'
    },
    {
        path:'login',
        component:LoginComponent,
    },
    {
        path:'dashboard',
        component:DashboardComponent
    },
    {
        path:'view-assessment',
        component:ViewAssessmentComponent
    },
    {
        path:'add-assessment',
        component:AddAssessmentComponent
    },
    {
        path:'edit-assessment',
        component:EditAssessmentComponent
    },
    {
        path:'admin',
        component:AdminComponent
    }
];