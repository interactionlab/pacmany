--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.10
-- Dumped by pg_dump version 9.5.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: controller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS controller (
    color text,
    model text,
    type text,
    resolution integer[],
    id integer NOT NULL,
    nickname text
);


ALTER TABLE controller OWNER TO postgres;

--
-- Name: controller_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS controller_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE controller_id_seq OWNER TO postgres;

--
-- Name: controller_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE controller_id_seq OWNED BY controller.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS games (
    id integer NOT NULL,
    location text,
    map text,
    name text,
    gamemode text
);


ALTER TABLE games OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS games_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE games_id_seq OWNER TO postgres;

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE games_id_seq OWNED BY games.id;


--
-- Name: ghost_movement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS ghost_movement (
    game_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    ghost_id integer NOT NULL,
    ghost_actiontype integer NOT NULL,
    action_data text
);


ALTER TABLE ghost_movement OWNER TO postgres;

--
-- Name: ghosts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS ghosts (
    color text,
    id integer NOT NULL
);


ALTER TABLE ghosts OWNER TO postgres;

--
-- Name: ghosts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS ghosts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE ghosts_id_seq OWNER TO postgres;

--
-- Name: ghosts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE ghosts_id_seq OWNED BY ghosts.id;


--
-- Name: movement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS movement (
    game_id integer NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    controller_id integer NOT NULL,
    player_direction integer NOT NULL
);


ALTER TABLE movement OWNER TO postgres;

--
-- Name: player_action; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS player_action (
    game_id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    controller_id integer NOT NULL,
    player_actiontype integer NOT NULL,
    action_data text
);




ALTER TABLE player_action OWNER TO postgres;

--
-- Name: screens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS screens (
    location text,
    id integer NOT NULL
);


ALTER TABLE screens OWNER TO postgres;

--
-- Name: screens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE IF NOT EXISTS screens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE screens_id_seq OWNER TO postgres;

--
-- Name: screens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE screens_id_seq OWNED BY screens.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY controller ALTER COLUMN id SET DEFAULT nextval('controller_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY games ALTER COLUMN id SET DEFAULT nextval('games_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ghosts ALTER COLUMN id SET DEFAULT nextval('ghosts_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY screens ALTER COLUMN id SET DEFAULT nextval('screens_id_seq'::regclass);


--
-- Name: controller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE controller DROP CONSTRAINT IF EXISTS controller_pkey;
ALTER TABLE ONLY controller
    ADD CONSTRAINT controller_pkey PRIMARY KEY (id);
--
-- Name: games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE games DROP CONSTRAINT IF EXISTS games_pkey;
ALTER TABLE ONLY games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: ghost_movement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ghost_movement DROP CONSTRAINT IF EXISTS ghost_movement_pkey;
ALTER TABLE ONLY ghost_movement
    ADD CONSTRAINT ghost_movement_pkey PRIMARY KEY (game_id, "timestamp", ghost_id);


--
-- Name: ghosts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ghosts DROP CONSTRAINT IF EXISTS ghosts_pkey;
ALTER TABLE ONLY ghosts
    ADD CONSTRAINT ghosts_pkey PRIMARY KEY (id);


--
-- Name: movement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE movement DROP CONSTRAINT IF EXISTS movement_pkey;
ALTER TABLE ONLY movement
    ADD CONSTRAINT movement_pkey PRIMARY KEY (game_id, "timestamp", controller_id);


--
-- Name: player_movement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE player_action DROP CONSTRAINT IF EXISTS player_movement_pkey;
ALTER TABLE ONLY player_action
    ADD CONSTRAINT player_movement_pkey PRIMARY KEY (game_id, "timestamp", controller_id);


--
-- Name: screens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE screens DROP CONSTRAINT IF EXISTS screens_pkey;
ALTER TABLE ONLY screens
    ADD CONSTRAINT screens_pkey PRIMARY KEY (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

