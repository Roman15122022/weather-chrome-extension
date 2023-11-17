import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {WeatherWidget} from "./weatherwidget";
import {WidgetUiMode} from "./WidgetUiMode";
import {LocalStorageService} from "./localstorage.service";
import {WIDGET_STORAGE_KEY, WidgetService} from "./widget.service";
import {interval, Observable, startWith} from "rxjs";
import {map, switchMap} from "rxjs/operators";
import {SlickCarouselComponent} from 'ngx-slick-carousel';
import {SlideConfig} from "./slide-config";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CityService} from "./city.service";
import {FormControl} from "@angular/forms";
import {MatSlideToggleChange} from "@angular/material/slide-toggle";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  weatherWidgets: WeatherWidget[] = Array.from({length: 2}, () => new WidgetUiMode({} as WeatherWidget));
  @ViewChild('slickModal', {static: true}) slickModal!: SlickCarouselComponent;
  @ViewChild('btnLeft') btnLeft!: ElementRef;
  @ViewChild('btnRight') btnRight!: ElementRef;
  @ViewChild('cityInput') cityInput!: ElementRef;
  @ViewChild('comp') compRef!: ElementRef;
  onOff : boolean = false;

  INTERVAL: number = 3000;
  slideConfig: SlideConfig = {
    slidesToScroll: 1,
    slidesToShow: 1,
    prevArrow: 0,
    nextArrow: 0,
  };

  cityArray: string[] = [];
  filterOptions!: Observable<string[]>;
  formsControl = new FormControl('');

  constructor(
    private storageService: LocalStorageService,
    private widgetService: WidgetService,
    private snackBar: MatSnackBar,
    private cityService: CityService,
  ) {
  }
  checkOnOff() {
    const component = this.compRef.nativeElement;
    const theme = localStorage.getItem("theme");
    component.classList.add(theme);
    this.onOff = (theme === 'darkMode');
  }

  darkLight(event: MatSlideToggleChange) {
    const component = this.compRef.nativeElement;
    if (event.checked) {
      component.classList.add("darkMode");
      localStorage.setItem("theme", "darkMode");
    } else {
      component.classList.remove("darkMode");
      localStorage.setItem("theme", "light");
    }
  }
  filterCity() {
    this.filterOptions = this.formsControl.valueChanges.pipe(
      startWith(''),
      map(value => this._FILTER(value || ''))
    );
  }

  fillingArray() {
    this.cityService.getCities().subscribe(
      (cities: string[]) => {
        this.cityArray = cities.sort();
      });
  }

  ngOnInit() {
    this.fillingArray();
    this.filterCity();
    this.checkOnOff();
    this.localStorage();
    this.runWatcher();
    this.updateWeather();
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

    this.widgetService.serviceData(currentWidget).subscribe(
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
          map(data => new WidgetUiMode(data))
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
   setTimeout(()=>{
     this.slickModal.slickNext()
   });
  }

  prevSlide() {
    this.slickModal.slickPrev();
  }

  private _FILTER(value: string): string[] {
    const searchValue = value.toLowerCase();
    return this.cityArray.filter(option => option.toLowerCase().includes(searchValue));
  }
}
