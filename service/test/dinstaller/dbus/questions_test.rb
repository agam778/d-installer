# frozen_string_literal: true

# Copyright (c) [2022] SUSE LLC
#
# All Rights Reserved.
#
# This program is free software; you can redistribute it and/or modify it
# under the terms of version 2 of the GNU General Public License as published
# by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, contact SUSE LLC.
#
# To contact SUSE LLC about this file by physical or electronic mail, you may
# find current contact information at www.suse.com.

require_relative "../../test_helper"
require "dinstaller/dbus/questions"
require "dinstaller/questions_manager"
require "dinstaller/question"
require "dinstaller/luks_activation_question"
require "dbus"

describe DInstaller::DBus::Questions do
  subject { described_class.new(backend, logger) }

  before do
    subject.instance_variable_set(:@service, service)
  end

  let(:backend) { DInstaller::QuestionsManager.new(logger) }

  let(:logger) { Logger.new($stdout, level: :warn) }

  let(:service) { instance_double(DBus::Service, export: nil, unexport: nil, bus: system_bus) }

  let(:system_bus) { instance_double(DBus::SystemBus) }

  it "configures callbacks for exporting a D-Bus question when a new question is added" do
    question1 = DInstaller::Question.new("test1")
    question2 = DInstaller::Question.new("test2")

    expect(service).to receive(:export) do |dbus_object|
      id = dbus_object.path.split("/").last.to_i
      expect(id).to eq(question1.id)
    end

    expect(service).to receive(:export) do |dbus_object|
      id = dbus_object.path.split("/").last.to_i
      expect(id).to eq(question2.id)
    end

    backend.add(question1)
    backend.add(question2)
  end

  it "configures callbacks for unexporting a D-Bus question when a question is deleted" do
    question1 = DInstaller::Question.new("test1")
    question2 = DInstaller::Question.new("test2")

    backend.add(question1)
    backend.add(question2)

    expect(service).to receive(:unexport) do |dbus_object|
      id = dbus_object.path.split("/").last.to_i
      expect(id).to eq(question1.id)
    end

    backend.delete(question1)
  end

  it "configures callbacks to dispatch D-Bus messages while waiting for answers" do
    allow(backend).to receive(:loop).and_yield
    allow(backend).to receive(:sleep)

    expect(system_bus).to receive(:dispatch_message_queue)

    question1 = DInstaller::Question.new("test1")
    backend.wait([question1])
  end
end
