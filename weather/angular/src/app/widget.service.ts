import {Injectable, ElementRef} from '@angular/core';
import {WidgetUiMode} from "./WidgetUiMode";
import {WeatherWidget} from "./weatherwidget";
import {map} from "rxjs/operators";
import {WeatherService} from "./weather.service";
import {MatButton} from "@angular/material/button";


export const WIDGET_STORAGE_KEY = 'widgets';

@Injectable({
  providedIn: 'root'
})
export class WidgetService {
  constructor(private weatherService: WeatherService) {
  }

  serviceData(widget: WeatherWidget) {
    return this.weatherService.getWeather(widget.name.trim())
      .pipe(
        map((data) => new WidgetUiMode(data))
      )
  }

  updateData(data: WidgetUiMode, widget: WeatherWidget) {
    Object.assign(widget, {
      weatherData: data,
      name: data.name,
      main: {
        temp: data.main.temp,
        temp_min: data.main.temp_min,
        temp_max: data.main.temp_max,
      },
      flag: true
    });
  }

  resetWidget(weatherWidgets: WeatherWidget[]) {
    weatherWidgets.forEach((item) => {
      if (item.weatherData != null) {
        Object.assign(item, {
          weatherData: null,
          name: '',
          main: {
            temp: 0,
            temp_min: 0,
            temp_max: 0,
          },
          flag: false,
        })
      }
    })
  }

  disabledButtons(showWidget: number, weatherWidgets: WeatherWidget[], btnLeft: ElementRef, btnRight: ElementRef, removeLast: MatButton) {
    if (weatherWidgets.length > showWidget) {
      weatherWidgets.length -= 1;
    }
    if (weatherWidgets.length === showWidget) {
      removeLast.color = undefined;
      btnLeft.nativeElement.classList.add('display_none');
      btnRight.nativeElement.classList.add('display_none');
    }
  }

  activeButtons(showWidget: number, weatherWidgets: WeatherWidget[], btnLeft: ElementRef, btnRight: ElementRef, removeLast: MatButton) {
    const newWidget = new WidgetUiMode({} as WeatherWidget);
    weatherWidgets.push(newWidget);
    if (weatherWidgets.length > showWidget) {
      removeLast.color = 'warn';
      btnLeft.nativeElement.classList.remove('display_none');
      btnRight.nativeElement.classList.remove('display_none');
    }
  }

}
