import {Injectable} from '@angular/core';
import {WidgetUiMode} from "./WidgetUiMode";
import {WeatherWidget} from "./weatherwidget";
import {map} from "rxjs/operators";
import {WeatherService} from "./weather.service";


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

  resetWidget(weatherWidgets: WeatherWidget[], id: number) {
    weatherWidgets.forEach((item) => {
      if (item.id === id) {
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

  delete(weatherWidgets: WeatherWidget[], id: number) {
    if (weatherWidgets.length > 1) {
      weatherWidgets.forEach((widget, index)=> {
        if (widget.id === id) {
        weatherWidgets.splice(index, 1);
      }
      })
    }
  }

  add(showWidget: number, weatherWidgets: WeatherWidget[]) {
    const newWidget = new WidgetUiMode({} as WeatherWidget);
    weatherWidgets.push(newWidget);
  }

}
