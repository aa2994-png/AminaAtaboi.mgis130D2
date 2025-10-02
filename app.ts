// ==================== TYPE DEFINITIONS ====================

interface WeatherAPIResponse {
    name: string;
    sys: {
        country: string;
    };
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
    };
    weather: Array<{
        main: string;
        description: string;
        icon: string;
    }>;
    wind: {
        speed: number;
    };
    visibility: number;
}

interface ProcessedWeatherData {
    city: string;
    temperature: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: string;
    windSpeed: string;
    pressure: string;
    visibility: string;
}

type TemperatureUnit = 'metric' | 'imperial';

interface APIError {
    cod: string;
    message: string;
}

// ==================== DATA LAYER ====================

class WeatherAPI {
    private readonly API_KEY: string = 'sS5fygzw6GdXzdn6UCgi2w==UuQyP6ZQyAycFmLs';
    private readonly API_URL: string = 'https://api.openweathermap.org/data/2.5/weather';

    /**
     * Fetches weather data from OpenWeather API
     * @param city - City name to search for
     * @param unit - Temperature unit (metric or imperial)
     * @returns Promise with weather data
     * @throws Error if API call fails
     */
    async fetchWeatherData(city: string, unit: TemperatureUnit): Promise<WeatherAPIResponse> {
        // Validate API key
        if (this.API_KEY === 'YOUR_API_KEY_HERE') {
            throw new Error('API key not configured. Please add your OpenWeather API key.');
        }

        // Validate city input
        if (!city || city.trim().length === 0) {
            throw new Error('City name cannot be empty.');
        }

        const url = `${this.API_URL}?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=${unit}`;

        try {
            const response = await fetch(url);

            // Handle HTTP errors
            if (!response.ok) {
                const errorData: APIError = await response.json();
                
                switch (response.status) {
                    case 404:
                        throw new Error('City not found. Please check the spelling and try again.');
                    case 401:
                        throw new Error('Invalid API key. Please check your configuration.');
                    case 429:
                        throw new Error('Too many requests. Please wait a moment and try again.');
                    default:
                        throw new Error(errorData.message || 'Failed to fetch weather data.');
                }
            }

            const data: WeatherAPIResponse = await response.json();
            return data;

        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError) {
                throw new Error('Network error. Please check your internet connection.');
            }
            // Re-throw other errors
            throw error;
        }
    }
}

// ==================== PROCESSING LAYER ====================

class WeatherProcessor {
    private currentUnit: TemperatureUnit = 'metric';

    /**
     * Maps OpenWeather icon codes to emoji
     */
    private readonly iconMap: Record<string, string> = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };

    /**
     * Set the current temperature unit
     */
    setUnit(unit: TemperatureUnit): void {
        this.currentUnit = unit;
    }

    /**
     * Get the current temperature unit
     */
    getUnit(): TemperatureUnit {
        return this.currentUnit;
    }

    /**
     * Converts weather icon code to emoji
     */
    private getWeatherIcon(iconCode: string): string {
        return this.iconMap[iconCode] || '🌤️';
    }

    /**
     * Formats temperature by rounding to nearest integer
     */
    private formatTemperature(temp: number): number {
        return Math.round(temp);
    }

    /**
     * Formats wind speed with appropriate unit
     */
    private formatWindSpeed(speed: number): string {
        const unit = this.currentUnit === 'metric' ? 'm/s' : 'mph';
        return `${speed.toFixed(1)} ${unit}`;
    }

    /**
     * Converts visibility from meters to kilometers
     */
    private formatVisibility(visibilityMeters: number): string {
        const km = visibilityMeters / 1000;
        return `${km.toFixed(1)} km`;
    }

    /**
     * Formats pressure with unit
     */
    private formatPressure(pressure: number): string {
        return `${pressure} hPa`;
    }

    /**
     * Formats humidity as percentage
     */
    private formatHumidity(humidity: number): string {
        return `${humidity}%`;
    }

    /**
     * Processes raw API data into user-friendly format
     * @param data - Raw weather data from API
     * @returns Processed weather data ready for display
     */
    processWeatherData(data: WeatherAPIResponse): ProcessedWeatherData {
        return {
            city: `${data.name}, ${data.sys.country}`,
            temperature: this.formatTemperature(data.main.temp),
            feelsLike: this.formatTemperature(data.main.feels_like),
            description: data.weather[0].description,
            icon: this.getWeatherIcon(data.weather[0].icon),
            humidity: this.formatHumidity(data.main.humidity),
            windSpeed: this.formatWindSpeed(data.wind.speed),
            pressure: this.formatPressure(data.main.pressure),
            visibility: this.formatVisibility(data.visibility)
        };
    }

    /**
     * Validates city name input
     */
    validateCityInput(city: string): { isValid: boolean; error?: string } {
        const trimmedCity = city.trim();

        if (trimmedCity.length === 0) {
            return { isValid: false, error: 'Please enter a city name.' };
        }

        if (trimmedCity.length < 2) {
            return { isValid: false, error: 'City name is too short.' };
        }

        if (trimmedCity.length > 100) {
            return { isValid: false, error: 'City name is too long.' };
        }

        // Check for invalid characters
        const validCityPattern = /^[a-zA-Z\s\-',\.]+$/;
        if (!validCityPattern.test(trimmedCity)) {
            return { isValid: false, error: 'City name contains invalid characters.' };
        }

        return { isValid: true };
    }
}

// ==================== UI LAYER (DOM MANIPULATION) ====================

class WeatherUI {
    private elements: {
        cityInput: HTMLInputElement;
        searchBtn: HTMLButtonElement;
        loading: HTMLElement;
        errorMessage: HTMLElement;
        weatherCard: HTMLElement;
        cityName: HTMLElement;
        temperature: HTMLElement;
        feelsLike: HTMLElement;
        description: HTMLElement;
        weatherIcon: HTMLElement;
        humidity: HTMLElement;
        windSpeed: HTMLElement;
        pressure: HTMLElement;
        visibility: HTMLElement;
        unitBtns: NodeListOf<HTMLButtonElement>;
    };

    constructor() {
        // Initialize all DOM elements with null checks
        this.elements = {
            cityInput: this.getElement<HTMLInputElement>('#cityInput'),
            searchBtn: this.getElement<HTMLButtonElement>('#searchBtn'),
            loading: this.getElement('#loading'),
            errorMessage: this.getElement('#errorMessage'),
            weatherCard: this.getElement('#weatherCard'),
            cityName: this.getElement('#cityName'),
            temperature: this.getElement('#temperature'),
            feelsLike: this.getElement('#feelsLike'),
            description: this.getElement('#description'),
            weatherIcon: this.getElement('#weatherIcon'),
            humidity: this.getElement('#humidity'),
            windSpeed: this.getElement('#windSpeed'),
            pressure: this.getElement('#pressure'),
            visibility: this.getElement('#visibility'),
            unitBtns: document.querySelectorAll<HTMLButtonElement>('.unit-btn')
        };
    }

    /**
     * Safely gets an element from the DOM
     */
    private getElement<T extends HTMLElement>(selector: string): T {
        const element = document.querySelector<T>(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }
        return element;
    }

    /**
     * Shows loading state
     */
    showLoading(): void {
        this.elements.loading.classList.add('show');
        this.elements.weatherCard.classList.remove('show');
        this.elements.errorMessage.classList.remove('show');
        this.elements.searchBtn.disabled = true;
        this.elements.cityInput.disabled = true;
    }

    /**
     * Hides loading state
     */
    hideLoading(): void {
        this.elements.loading.classList.remove('show');
        this.elements.searchBtn.disabled = false;
        this.elements.cityInput.disabled = false;
    }

    /**
     * Displays error message
     */
    showError(message: string): void {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('show');
        this.elements.weatherCard.classList.remove('show');

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            this.elements.errorMessage.classList.remove('show');
        }, 5000);
    }

    /**
     * Updates the UI with weather data
     */
    displayWeatherData(weather: ProcessedWeatherData, unit: TemperatureUnit): void {
        const tempUnit = unit === 'metric' ? '°C' : '°F';

        // Update all weather information
        this.elements.cityName.textContent = weather.city;
        this.elements.temperature.textContent = `${weather.temperature}${tempUnit}`;
        this.elements.feelsLike.textContent = `Feels like ${weather.feelsLike}${tempUnit}`;
        this.elements.description.textContent = weather.description;
        this.elements.weatherIcon.textContent = weather.icon;
        this.elements.humidity.textContent = weather.humidity;
        this.elements.windSpeed.textContent = weather.windSpeed;
        this.elements.pressure.textContent = weather.pressure;
        this.elements.visibility.textContent = weather.visibility;

        // Show weather card and hide error
        this.elements.weatherCard.classList.add('show');
        this.elements.errorMessage.classList.remove('show');
    }

    /**
     * Gets the current city input value
     */
    getCityInput(): string {
        return this.elements.cityInput.value;
    }

    /**
     * Clears the city input field
     */
    clearCityInput(): void {
        this.elements.cityInput.value = '';
    }

    /**
     * Updates active unit button
     */
    updateUnitButtons(activeUnit: TemperatureUnit): void {
        this.elements.unitBtns.forEach(btn => {
            const btnUnit = btn.getAttribute('data-unit') as TemperatureUnit;
            if (btnUnit === activeUnit) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Checks if weather card is currently displayed
     */
    isWeatherDisplayed(): boolean {
        return this.elements.weatherCard.classList.contains('show');
    }
}

// ==================== APPLICATION CONTROLLER ====================

class WeatherApp {
    private weatherAPI: WeatherAPI;
    private weatherProcessor: WeatherProcessor;
    private weatherUI: WeatherUI;

    constructor() {
        this.weatherAPI = new WeatherAPI();
        this.weatherProcessor = new WeatherProcessor();
        this.weatherUI = new WeatherUI();

        this.initializeEventListeners();
    }

    /**
     * Sets up all event listeners
     */
    private initializeEventListeners(): void {
        // Search button click
        const searchBtn = document.getElementById('searchBtn');
        searchBtn?.addEventListener('click', () => this.handleSearch());

        // Enter key in input field
        const cityInput = document.getElementById('cityInput');
        cityInput?.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Unit toggle buttons
        const unitBtns = document.querySelectorAll('.unit-btn');
        unitBtns.forEach(btn => {
            btn.addEventListener('click', (e: Event) => {
                const target = e.target as HTMLButtonElement;
                const unit = target.getAttribute('data-unit') as TemperatureUnit;
                this.handleUnitChange(unit);
            });
        });
    }

    /**
     * Handles search button click
     */
    private async handleSearch(): Promise<void> {
        try {
            const city = this.weatherUI.getCityInput();

            // Validate input
            const validation = this.weatherProcessor.validateCityInput(city);
            if (!validation.isValid) {
                this.weatherUI.showError(validation.error!);
                return;
            }

            // Show loading state
            this.weatherUI.showLoading();

            // Fetch data from API
            const currentUnit = this.weatherProcessor.getUnit();
            const rawData = await this.weatherAPI.fetchWeatherData(city.trim(), currentUnit);

            // Process the data
            const processedData = this.weatherProcessor.processWeatherData(rawData);

            // Update UI
            this.weatherUI.displayWeatherData(processedData, currentUnit);

        } catch (error) {
            // Handle errors
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
            this.weatherUI.showError(errorMessage);
        } finally {
            // Always hide loading state
            this.weatherUI.hideLoading();
        }
    }

    /**
     * Handles temperature unit change
     */
    private async handleUnitChange(newUnit: TemperatureUnit): Promise<void> {
        const currentUnit = this.weatherProcessor.getUnit();

        // Don't do anything if unit hasn't changed
        if (newUnit === currentUnit) {
            return;
        }

        // Update processor unit
        this.weatherProcessor.setUnit(newUnit);

        // Update UI buttons
        this.weatherUI.updateUnitButtons(newUnit);

        // Refresh data if weather is currently displayed
        if (this.weatherUI.isWeatherDisplayed()) {
            await this.handleSearch();
        }
    }

    /**
     * Initializes the app with a default city (optional)
     */
    async loadDefaultCity(city: string): Promise<void> {
        const cityInput = document.getElementById('cityInput') as HTMLInputElement;
        if (cityInput) {
            cityInput.value = city;
            await this.handleSearch();
        }
    }
}

// ==================== APPLICATION INITIALIZATION ====================

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        const app = new WeatherApp();
        
        // Optional: Load a default city
        // app.loadDefaultCity('London');
        
        console.log('Weather Dashboard initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize Weather Dashboard:', error);
        alert('Failed to initialize the application. Please refresh the page.');
    }
});
