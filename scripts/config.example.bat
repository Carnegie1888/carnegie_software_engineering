@echo off
REM ========================================
REM CONFIG TEMPLATE - Copy to config.bat and modify
REM ========================================

REM ==== JDK: Tomcat needs JAVA_HOME; remove next line if set in system env ====
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Java\jdk-17"

REM ==== YOUR TOMCAT PATH ====
set CATALINA_HOME=YOUR_TOMCAT_PATH_HERE
set TOMCAT_HOME=%CATALINA_HOME%

REM ==== APP NAME (optional) ====
set APP_NAME=groupproject
