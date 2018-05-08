#pragma once

#include <stdlib.h>
#include <stdint.h>
#include <memory>
#include <string>
#include <functional>

class http_responder{
public:
    virtual ~http_responder()=default;
    virtual void respondWithNotFound() = 0;
    virtual void respondWithError(const std::string& message) = 0;
    virtual void respondWithFile(const std::string& path, const std::string& contentType={}) = 0;
    virtual void respondWithText(const std::string& data, const std::string& contentType) = 0;
};

class ws_responder{
public:
    virtual ~ws_responder()=default;
    virtual void respond(const std::string& data) = 0;
};

class web_server{
public:
    struct config{
        std::string address;
        uint16_t port;
        std::string webroot;
    };
    web_server(size_t argThreads);
    ~web_server();
    bool init(const config& argConfig);
    void run();
    void shutdown();

    using http_handler=std::function<void(const std::string& uri,http_responder& resp)>;
    using ws_handler=std::function<void(const std::string& data,ws_responder& resp)>;

    void registerHttpHandler(const std::string& prefix, http_handler hnd);
    void registerWsHandler(const std::string& prefix, ws_handler hnd);

protected:
    struct web_server_impl;
    std::unique_ptr<web_server_impl> m_impl;
};
