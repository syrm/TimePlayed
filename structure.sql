-- MySQL dump 10.13  Distrib 5.5.62, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: timeplayed
-- ------------------------------------------------------
-- Server version	5.5.62-0+deb8u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `afk`
--

DROP TABLE IF EXISTS `afk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `afk` (
  `userID` decimal(20,0) NOT NULL,
  `startDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gameAliases`
--

DROP TABLE IF EXISTS `gameAliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gameAliases` (
  `game` tinytext NOT NULL,
  `alias` tinytext NOT NULL,
  UNIQUE KEY `alias_UNIQUE` (`alias`(32))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildPrivacy`
--

DROP TABLE IF EXISTS `guildPrivacy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guildPrivacy` (
  `guildID` decimal(20,0) NOT NULL,
  `value` decimal(1,0) NOT NULL,
  PRIMARY KEY (`guildID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildSettings`
--

DROP TABLE IF EXISTS `guildSettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guildSettings` (
  `guildID` decimal(20,0) NOT NULL,
  `prefix` tinytext,
  `rankingChannel` decimal(20,0) DEFAULT NULL,
  `defaultGame` tinytext,
  `leaderboardLayout` varchar(2000) DEFAULT NULL,
  `leaderboardNoMoreToday` varchar(200) DEFAULT NULL,
  `leaderboardNoMoreWeek` varchar(200) DEFAULT NULL,
  `leaderboardNoMoreAlways` varchar(200) DEFAULT NULL,
  `leaderboardNoToday` varchar(200) DEFAULT NULL,
  `leaderboardNoWeek` varchar(200) DEFAULT NULL,
  `leaderboardNoAlways` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`guildID`),
  KEY `by_guildID` (`guildID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `guildStats`
--

DROP TABLE IF EXISTS `guildStats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guildStats` (
  `userID` decimal(20,0) DEFAULT NULL,
  `game` tinytext,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `guildID` decimal(20,0) DEFAULT NULL,
  KEY `by_guildID` (`guildID`),
  KEY `by_userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knownGames`
--

DROP TABLE IF EXISTS `knownGames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `knownGames` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game` varchar(128) NOT NULL,
  `iconURL` varchar(300) DEFAULT NULL,
  `type` tinyint(2) NOT NULL DEFAULT '0',
  `color` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `by_game` (`game`)
) ENGINE=InnoDB AUTO_INCREMENT=3182 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lastOnline`
--

DROP TABLE IF EXISTS `lastOnline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lastOnline` (
  `userID` decimal(20,0) DEFAULT NULL,
  `date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `playtime`
--

DROP TABLE IF EXISTS `playtime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playtime` (
  `userID` decimal(20,0) DEFAULT NULL,
  `game` varchar(128) DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  KEY `by_id` (`userID`),
  KEY `by_game` (`game`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `premium`
--

DROP TABLE IF EXISTS `premium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `premium` (
  `userID` decimal(20,0) DEFAULT NULL,
  `guildID` decimal(20,0) NOT NULL,
  `assignedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `guildID_UNIQUE` (`guildID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `privateUsers`
--

DROP TABLE IF EXISTS `privateUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `privateUsers` (
  `userID` decimal(20,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roleAwards`
--

DROP TABLE IF EXISTS `roleAwards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roleAwards` (
  `guildID` decimal(20,0) DEFAULT NULL,
  `game` varchar(128) DEFAULT NULL,
  `time` mediumint(9) DEFAULT NULL,
  `per` mediumint(9) DEFAULT NULL,
  `roleID` decimal(20,0) DEFAULT NULL,
  KEY `by_guildID` (`guildID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `termsAccept`
--

DROP TABLE IF EXISTS `termsAccept`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `termsAccept` (
  `userID` decimal(20,0) NOT NULL,
  `accept` tinyint(1) DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `topGames`
--

DROP TABLE IF EXISTS `topGames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topGames` (
  `game` tinytext,
  `players` tinytext,
  `iconURL` tinytext,
  `since` int(11) DEFAULT NULL,
  `hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-01-12  5:28:03
