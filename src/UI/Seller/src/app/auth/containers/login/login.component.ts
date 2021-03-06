// angular
import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

// ordercloud
import { OcAuthService, OcMeService, OcTokenService } from '@ordercloud/angular-sdk';
import {
  applicationConfiguration,
  AppConfig,
} from '@app-seller/config/app.config';
import { AppAuthService } from '@app-seller/auth/services/app-auth.service';
import { AppStateService } from '@app-seller/shared';

@Component({
  selector: 'auth-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  isAnon: boolean;

  constructor(
    private ocAuthService: OcAuthService,
    private appAuthService: AppAuthService,
    private ocTokenService: OcTokenService,
    private ocMeService: OcMeService,
    private router: Router,
    private formBuilder: FormBuilder,
    private appStateService: AppStateService,
    @Inject(applicationConfiguration) private appConfig: AppConfig
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: '',
      password: '',
      rememberMe: false,
    });
  }

  onSubmit() {
    return this.ocAuthService
      .Login(
        this.form.get('username').value,
        this.form.get('password').value,
        this.appConfig.clientID,
        this.appConfig.scope
      )
      .subscribe((response) => {
        const rememberMe = this.form.get('rememberMe').value;
        
        if (rememberMe && response.refresh_token) {

          
          /**
           * set the token duration in the dashboard - https://developer.ordercloud.io/dashboard/settings
           * refresh tokens are configured per clientID and initially set to 0
           * a refresh token of 0 means no refresh token is returned in OAuth response
           */
          this.ocTokenService.SetRefresh(response.refresh_token);
          this.appAuthService.setRememberStatus(true);
        }
        this.ocTokenService.SetAccess(response.access_token);
        this.appStateService.isLoggedIn.next(true);
        this.ocMeService.Get().subscribe((res) => {
          console.log("get",res);
        });
        this.router.navigateByUrl('/home');
      });
  }
}
