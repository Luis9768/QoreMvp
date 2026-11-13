# Estágio de Compilação (SDK .NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY QaAgent.Api.csproj ./
RUN dotnet restore QaAgent.Api.csproj

COPY . .
RUN dotnet publish QaAgent.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Estágio de Execução Enxuto (Runtime ASP.NET 10 — Igual ao ServSegFacilitiesAPI)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

RUN mkdir -p /app/wwwroot/evidencias

COPY --from=build /app/publish .

EXPOSE 5000

ENTRYPOINT ["dotnet", "QaAgent.Api.dll"]
