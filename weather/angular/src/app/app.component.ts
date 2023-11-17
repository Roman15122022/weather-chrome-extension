import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WeatherWidget} from "./types/weather-widget";
import {WidgetUiMode} from "./models/WidgetUiMode";
import {LocalStorageService} from "./services/localstorage.service";
import {WIDGET_STORAGE_KEY, WidgetService} from "./services/widget.service";
import {interval, Observable, startWith, ReplaySubject} from "rxjs";
import {map, switchMap, takeUntil} from "rxjs/operators";
import {SlickCarouselComponent} from 'ngx-slick-carousel';
import {SlideConfig} from "./types/slide-config";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CityService} from "./services/city.service";
import {FormControl} from "@angular/forms";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  weatherWidgets: WeatherWidget[] = Array.from({length: 2}, () => new WidgetUiMode({} as WeatherWidget));
  @ViewChild('slickModal', {static: true}) slickModal!: SlickCarouselComponent;
  @ViewChild('btnLeft') btnLeft!: ElementRef;
  @ViewChild('btnRight') btnRight!: ElementRef;
  @ViewChild('cityInput') cityInput!: ElementRef;
  @ViewChild('comp') compRef!: ElementRef;
  onOff : boolean = false;
  destroy$ = new ReplaySubject<void>(1);

  INTERVAL: number = 3000;
  slideConfig: SlideConfig = {
    slidesToScroll: 1,
    slidesToShow: 1,
    prevArrow: 0,
    nextArrow: 0,
  };

  cityArray: string[] = [];
  filterOptions$!: Observable<string[]>;
  formsControl = new FormControl('');

  constructor(
    private storageService: LocalStorageService,
    private widgetService: WidgetService,
    private snackBar: MatSnackBar,
    private cityService: CityService,
  ) {}


  ngOnInit() {
    this.fillingArray();
    this.filterCity();
    this.checkOnOff();
    this.localStorage();
    this.runWatcher();
    this.updateWeather();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkOnOff() {
    const component = this.compRef?.nativeElement;
    const theme = localStorage.getItem("theme");
    component?.classList.add(theme);
    this.onOff = (theme === 'darkMode');
  }

  darkLight(event: MatSlideToggleChange) {
    const component = this.compRef?.nativeElement;

    if (event.checked) {
      component.classList.add("darkMode");
      localStorage.setItem("theme", "darkMode");
    } else {
      component.classList.remove("darkMode");
      localStorage.setItem("theme", "light");
    }
  }

  filterCity() {
    this.filterOptions$ = this.formsControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
      takeUntil(this.destroy$)
    );
  }

  fillingArray() {
    this.cityService.getCities().pipe(takeUntil(this.destroy$)).subscribe(
      (cities: string[]) => {
        this.cityArray = cities.sort();
      });
  }

  updateWeather() {
    for (const widget of this.weatherWidgets) {
      this.getWeather(widget.id);
    }
  }

  showInput(id: number) {
    const widget = this.weatherWidgets.find(item => item.id === id) || {} as WidgetUiMode;
    widget.flag = false;
  }

  getWeather(id: number) {
    const currentWidget = this.weatherWidgets.find(item => item.id === id) || {} as WidgetUiMode;

    if (!currentWidget.name) return;

    this.widgetService.serviceData(currentWidget).pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        this.widgetService.updateData(data, currentWidget);
        this.setLocalStorage();
      },
      (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.openSnackBar();
        } else {
          console.error('An error occurred while receiving weather data:', error.statusText);
        }
      }
    );
  }

  openSnackBar() {
    this.snackBar.open('Incorrect city name. Please check the input', 'Done', {
      duration: 2000,
    });
  }

  runWatcher() {
    for (const widget of this.weatherWidgets) {
      interval(this.INTERVAL)
        .pipe(
          switchMap(() => this.widgetService.serviceData(widget)),
          map(data => new WidgetUiMode(data)),
          takeUntil(this.destroy$)
        ).subscribe(data => {
        this.widgetService.updateData(data, widget);
      });
    }
  }

  localStorage() {
    this.weatherWidgets = this.storageService.getItem(WIDGET_STORAGE_KEY);
  }

  setLocalStorage() {
    this.storageService.setItem(WIDGET_STORAGE_KEY, this.weatherWidgets);
  }

  resetThisWidget(id: number) {
    this.widgetService.resetWidget(this.weatherWidgets, id);
  }

  deleteThisWidget(id: number) {
    this.widgetService.delete(this.weatherWidgets, id);
  }

  nextSlide() {
    this.widgetService.add(this.slideConfig.slidesToShow, this.weatherWidgets);
    setTimeout(() => {
      this.slickModal.slickNext()
    }, 0);
  }

  prevSlide() {
    this.slickModal.slickPrev();
  }

  private _filter(value: string): string[] {
    const searchValue = value.toLowerCase();
    return this.cityArray.filter(option => option.toLowerCase().includes(searchValue));
  }
}
