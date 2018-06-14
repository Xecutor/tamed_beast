#include <iostream>
#include "web_server.hpp"
#include "json_rpc_service.hpp"

#include <boost/filesystem.hpp>
#include <boost/program_options.hpp>
#include <fmt/format.h>

#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>

class tamed_beast_app{
public:
    enum{
        version_major = 0,
        version_minor = 5,
    };

    bool init(int argc, const char*const argv[])
    {
        m_ingnomia_root = "c:/Program Files/Steam/steamapps/common/Ingnomia/";

        boost::filesystem::path backup_path;
        bool perform_backup = true;

        namespace po = boost::program_options;
        po::options_description options("Options");
        options.add_options()
            ("help", "This help page")
            ("web_host,h", po::value<std::string>(&m_web_config.address)->default_value(m_web_config.address))
            ("web_port,p", po::value<uint16_t>(&m_web_config.port)->default_value(m_web_config.port))
            ("game_root,r", po::value<boost::filesystem::path>(&m_ingnomia_root)->default_value(m_ingnomia_root))
            ("backup_path,b", po::value<boost::filesystem::path>(&backup_path)->default_value(""))
            ("disable_backup,n", "Disable backup")
            ("debug,d", "Enable debug output of web server")
            ("open,o", "Open default browser on start");

        po::variables_map vm;
        po::store(po::parse_command_line(argc, argv, options), vm);
        po::notify(vm);

        const char* config_file = "tamed_beast.ini";

        if ( boost::filesystem::exists(config_file) ) {
            std::ifstream is;
            is.open(config_file);
            if ( is.good() ) {
                po::store(po::parse_config_file(is, options), vm);
                po::notify(vm);
            }
            is.close();
        }

        if(vm.count("help")) {
            std::cout << options << std::endl;
            std::cout << "Long options can be specified in tamed_beast.ini" <<std::endl;
            return false;
        }

        if(vm.count("debug")) {
            m_web_config.debug = true;
        }

        if(vm.count("disable_backup")) {
            perform_backup = false;
        }

        m_tiles_path= m_ingnomia_root / "content" / "tilesheet";
        auto data_path = m_ingnomia_root / "content" / "JSON";

        m_web_server.init(m_web_config);
        json_rpc_service::config json_rpc_config;
        json_rpc_config.data_path = data_path;
        json_rpc_config.backup_path = backup_path;
        json_rpc_config.perform_backup = perform_backup;
        m_jsonrpc_svc.init(json_rpc_config);

        if(vm.count("open")) {
            system(fmt::format("start \"\" http://{}:{}/", m_web_config.address, m_web_config.port).c_str());
        }

        m_web_server.registerHttpHandler("/tilesheet/", std::bind(&tamed_beast_app::tile_file_handler, this, std::placeholders::_1, std::placeholders::_2));
        m_web_server.registerWsHandler("/json_ws", std::bind(&tamed_beast_app::json_rpc_handler, this, std::placeholders::_1, std::placeholders::_2));
        return true;
    }

    void start()
    {
        m_web_server.run();
    }

    void shutdown()
    {
        m_web_server.shutdown();
    }

private:
    web_server::config m_web_config;
    web_server m_web_server;
    json_rpc_service m_jsonrpc_svc;

    boost::filesystem::path m_ingnomia_root;
    boost::filesystem::path m_tiles_path;

    void tile_file_handler(const std::string& request, http_responder& responder)
    {
        boost::filesystem::path fullPath = m_tiles_path;
        boost::filesystem::path relativePath = request;
        fullPath /= relativePath.leaf();
        if (!boost::filesystem::exists(fullPath)) {
            responder.respondWithNotFound();
            return;
        }
        responder.respondWithFile(fullPath.string());
    }

    void json_rpc_handler(const std::string& request, ws_responder& responder)
    {
        rapidjson::Document req;
        rapidjson::StringStream ss(request.c_str());
        req.ParseStream(ss);

        auto errorHandler = [&responder, &req](int code, const char* message) {
            rapidjson::Document resp(rapidjson::kObjectType);

            auto id = req.FindMember("id");
            if(id!=req.MemberEnd()) {
                resp.AddMember("id", id->value.GetInt(), resp.GetAllocator());
            }
            resp.AddMember("jsonrpc", "2.0", resp.GetAllocator());
            auto& error = resp.AddMember("error", rapidjson::kObjectType, resp.GetAllocator());
            error.AddMember("code", code, resp.GetAllocator());
            rapidjson::Value v(message, resp.GetAllocator());
            error.AddMember("message", rapidjson::Value(message, resp.GetAllocator()), resp.GetAllocator());

            rapidjson::StringBuffer sbuf;
            rapidjson::Writer<rapidjson::StringBuffer> writer(sbuf);
            resp.Accept(writer);

            responder.respond(sbuf.GetString());
        };

        try{
            if (req.HasParseError()) {
                throw json_rpc_exception(json_rpc_error::parse_error, "Parse error");
            }
            auto method = req.FindMember("method");
            auto params = req.FindMember("params");
            auto id = req.FindMember("id");
            if (method == req.MemberEnd() ||
                params == req.MemberEnd() ||
                id == req.MemberEnd() ||
                !method->value.IsString() ||
                !id->value.IsInt()) {
                throw json_rpc_exception(json_rpc_error::invalid_request, "Invalid method format");
            }
            json_rpc_method_params mparams(params->value);
            auto result = m_jsonrpc_svc.callMethod(method->value.GetString(), mparams);

            rapidjson::Document resp(rapidjson::kObjectType);

            resp.AddMember("id", id->value.GetInt(), resp.GetAllocator());
            resp.AddMember("jsonrpc", "2.0", resp.GetAllocator());
            rapidjson::Value res(result.get_document(), resp.GetAllocator());

            resp.AddMember("result", res, resp.GetAllocator());

            rapidjson::StringBuffer sbuf;
            rapidjson::Writer<rapidjson::StringBuffer> writer(sbuf);
            resp.Accept(writer);

            responder.respond(sbuf.GetString());

        }catch(json_rpc_exception& e)
        {
            errorHandler(e.get_error(), e.what());
        }catch(std::exception& e)
        {
            errorHandler(static_cast<int>(json_rpc_error::internal_error), e.what());
        }

    }
};


int main(int argc, char* argv[])
{
    std::cout<<"Tamed beast - Ingnomia data editing/viewing tool v"<<
            tamed_beast_app::version_major<< '.' << tamed_beast_app::version_minor<<std::endl;
    try {
        tamed_beast_app app;
        if ( !app.init(argc, argv) ) {
            return EXIT_FAILURE;
        }
        app.start();
        app.shutdown();

        return EXIT_SUCCESS;
    }
    catch (std::exception& e) {
        std::cerr << "Exception: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }
}
